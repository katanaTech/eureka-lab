import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';
import { BadgeService } from '../gamification/badge.service';
import type {
  BattleConfig,
  BattleOutcome,
  BattleType,
  COMBAT_HP_CONFIG,
  COMBAT_XP_REWARDS,
  ZombieType,
  ZoneId,
} from '@eureka-lab/shared-types';
import {
  COMBAT_HP_CONFIG as HP_CONFIG,
  COMBAT_XP_REWARDS as XP_REWARDS,
} from '@eureka-lab/shared-types';
import { InitBattleDto } from './dto/init-battle.dto';
import { CompleteBattleDto } from './dto/complete-battle.dto';
import { getZoneQuestions, getOverlordQuestions } from './quiz-bank';

/** Shape of a combat session stored in Firestore */
interface CombatSession {
  userId: string;
  zoneId: ZoneId | null;
  battleType: BattleType;
  zombieType: ZombieType;
  outcome: BattleOutcome | 'in_progress';
  correctAnswers: number;
  totalQuestions: number;
  xpAwarded: number;
  startedAt: string;
  completedAt: string | null;
}

/** Per-zombie display configuration */
const ZOMBIE_CONFIGS: Record<
  ZombieType,
  { name: string; dialogue: string }
> = {
  misinformation_mole: {
    name: 'Misinformation Mole',
    dialogue: 'Your prompts are WORTHLESS!',
  },
  lazy_bot: {
    name: 'Lazy Bot',
    dialogue: 'Automation is DANGEROUS!',
  },
  bug_monster: {
    name: 'Bug Monster',
    dialogue: 'All code leads to CHAOS!',
  },
  memory_eraser: {
    name: 'Memory Eraser',
    dialogue: 'Agents will DESTROY you!',
  },
  overlord: {
    name: 'Anti-AI Overlord',
    dialogue: 'NO CHILD SHALL LEARN AI!',
  },
};

/** Maps a zone to its guardian zombie type */
const ZONE_ZOMBIE: Record<ZoneId, ZombieType> = {
  library: 'misinformation_mole',
  forge: 'lazy_bot',
  citadel: 'bug_monster',
  academy: 'memory_eraser',
};

/**
 * Service for the combat system — battle initialisation, completion, and certificate generation.
 * All Firestore operations include a userId filter (CLAUDE.md Rule 3).
 */
@Injectable()
export class CombatService {
  private readonly logger = new Logger(CombatService.name);
  private readonly collection = 'combat-sessions';

  constructor(
    private readonly firebase: FirebaseService,
    private readonly badgeService: BadgeService,
  ) {}

  /**
   * Initialise a new battle session and return the battle configuration.
   * Writes a combat-session document to Firestore.
   *
   * @param userId - Authenticated child user UID
   * @param dto - Battle init parameters
   * @returns Battle configuration consumed by the frontend CombatArena
   */
  async initBattle(userId: string, dto: InitBattleDto): Promise<BattleConfig> {
    const { battleType, zoneId, missionId } = dto;

    if (battleType !== 'overlord' && !zoneId) {
      throw new BadRequestException(
        'zoneId is required for minion and guardian battle types.',
      );
    }

    const zombieType: ZombieType =
      battleType === 'overlord' ? 'overlord' : ZONE_ZOMBIE[zoneId!];

    const zombieConfig = ZOMBIE_CONFIGS[zombieType];
    const hpConfig = HP_CONFIG[battleType];

    const questions =
      battleType === 'overlord'
        ? getOverlordQuestions(5)
        : getZoneQuestions(
            zoneId!,
            battleType === 'guardian' ? 2 : 1,
            battleType === 'guardian' ? 10 : 5,
          );

    const battleId = randomUUID();

    const session: CombatSession = {
      userId,
      zoneId: zoneId ?? null,
      battleType,
      zombieType,
      outcome: 'in_progress',
      correctAnswers: 0,
      totalQuestions: questions.length,
      xpAwarded: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    await this.firebase.firestore
      .collection(this.collection)
      .doc(battleId)
      .set(session);

    this.logger.log(
      `Battle ${battleId} initiated: userId=${userId} type=${battleType} zombie=${zombieType}`,
    );

    return {
      battleId,
      battleType,
      zombieType,
      zombieName: zombieConfig.name,
      zombieDialogue: zombieConfig.dialogue,
      playerMaxHp: hpConfig.playerHp,
      zombieMaxHp: hpConfig.zombieHp,
      questions,
    };
  }

  /**
   * Record a battle outcome, award XP on victory, and trigger badge checks.
   *
   * @param userId - Authenticated child user UID
   * @param battleId - Firestore document ID for this battle
   * @param dto - Outcome and performance data
   * @returns XP awarded and any badges unlocked
   */
  async completeBattle(
    userId: string,
    battleId: string,
    dto: CompleteBattleDto,
  ): Promise<{ xpAwarded: number; badgesUnlocked: string[]; battleType: BattleType }> {
    const ref = this.firebase.firestore.collection(this.collection).doc(battleId);
    const snap = await ref.get();

    if (!snap.exists) {
      throw new NotFoundException(`Battle session ${battleId} not found.`);
    }

    const session = snap.data() as CombatSession;

    // CLAUDE.md Rule 3 — always verify userId ownership
    if (session.userId !== userId) {
      throw new ForbiddenException('You do not own this battle session.');
    }

    if (session.outcome !== 'in_progress') {
      throw new BadRequestException('This battle has already been completed.');
    }

    const xpAwarded =
      dto.outcome === 'victory' ? XP_REWARDS[session.battleType] : 0;

    let badgesUnlocked: string[] = [];

    if (dto.outcome === 'victory') {
      try {
        const result = await this.badgeService.checkAndAwardBadges(userId, {
          type: 'module_completed',
        });
        badgesUnlocked = result.newBadges.map((b) => b.id);
      } catch (err) {
        this.logger.warn(
          `Badge check failed for userId=${userId} battleId=${battleId}: ${String(err)}`,
        );
      }
    }

    await ref.update({
      outcome: dto.outcome,
      correctAnswers: dto.correctAnswers,
      totalQuestions: dto.totalQuestions,
      xpAwarded,
      completedAt: new Date().toISOString(),
    });

    this.logger.log(
      `Battle ${battleId} completed: userId=${userId} outcome=${dto.outcome} xp=${xpAwarded}`,
    );

    return { xpAwarded, badgesUnlocked, battleType: session.battleType };
  }

  /**
   * Generate a personalised victory certificate SVG for a child who defeated the overlord.
   * Uploads to Firebase Storage and returns a signed URL.
   *
   * @param userId - Authenticated child user UID
   * @param displayName - Child's display name to embed in the certificate
   * @returns Signed Firebase Storage URL valid for 24 hours
   */
  async generateCertificate(
    userId: string,
    displayName: string,
  ): Promise<{ certificateUrl: string }> {
    const date = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const svg = buildCertificateSvg(displayName, date);
    const buffer = Buffer.from(svg, 'utf-8');

    const filePath = `certificates/${userId}/ai-champion-certificate.svg`;
    const file = this.firebase.storage.bucket().file(filePath);

    await file.save(buffer, {
      contentType: 'image/svg+xml',
      metadata: { cacheControl: 'public, max-age=86400' },
    });

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    this.logger.log(`Certificate generated for userId=${userId}`);

    return { certificateUrl: signedUrl };
  }
}

/**
 * Build the certificate SVG string.
 *
 * @param name - Child's display name
 * @param date - Formatted date string
 * @returns SVG markup as a string
 */
function buildCertificateSvg(name: string, date: string): string {
  // Escape to prevent SVG injection
  const safeName = name.replace(/[<>&"']/g, (c) => {
    const escapes: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return escapes[c] ?? c;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f0c29"/>
      <stop offset="50%" stop-color="#302b63"/>
      <stop offset="100%" stop-color="#24243e"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f7971e"/>
      <stop offset="100%" stop-color="#ffd200"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="800" height="560" fill="url(#bg)" rx="20"/>

  <!-- Border -->
  <rect x="16" y="16" width="768" height="528" fill="none"
        stroke="url(#gold)" stroke-width="3" rx="14" opacity="0.8"/>
  <rect x="24" y="24" width="752" height="512" fill="none"
        stroke="url(#gold)" stroke-width="1" rx="10" opacity="0.4"/>

  <!-- Trophy -->
  <text x="400" y="100" text-anchor="middle" font-size="64">🏆</text>

  <!-- Title -->
  <text x="400" y="155" text-anchor="middle"
        font-family="Georgia, serif" font-size="13" letter-spacing="6"
        fill="url(#gold)" opacity="0.9">CERTIFICATE OF ACHIEVEMENT</text>

  <!-- Divider -->
  <line x1="160" y1="172" x2="640" y2="172" stroke="url(#gold)" stroke-width="1" opacity="0.5"/>

  <!-- This certifies that -->
  <text x="400" y="212" text-anchor="middle"
        font-family="Georgia, serif" font-size="16" fill="#c4b5fd">
    This certifies that
  </text>

  <!-- Child name -->
  <text x="400" y="268" text-anchor="middle"
        font-family="Georgia, serif" font-size="40" font-style="italic"
        fill="url(#gold)">${safeName}</text>

  <!-- Divider under name -->
  <line x1="180" y1="284" x2="620" y2="284" stroke="url(#gold)" stroke-width="1" opacity="0.4"/>

  <!-- Achievement text -->
  <text x="400" y="322" text-anchor="middle"
        font-family="Georgia, serif" font-size="16" fill="#c4b5fd">
    has mastered all four islands of the AI Archipelago
  </text>
  <text x="400" y="350" text-anchor="middle"
        font-family="Georgia, serif" font-size="16" fill="#c4b5fd">
    and defeated the Anti-AI Overlord
  </text>

  <!-- Champion title -->
  <text x="400" y="402" text-anchor="middle"
        font-family="Georgia, serif" font-size="26" font-weight="bold"
        fill="url(#gold)">AI LITERACY CHAMPION</text>

  <!-- Zone badges row -->
  <text x="230" y="450" text-anchor="middle" font-size="32">📚</text>
  <text x="310" y="450" text-anchor="middle" font-size="32">⚙️</text>
  <text x="490" y="450" text-anchor="middle" font-size="32">🏰</text>
  <text x="570" y="450" text-anchor="middle" font-size="32">🤖</text>
  <text x="400" y="452" text-anchor="middle" font-size="28">⭐</text>

  <!-- Date -->
  <text x="400" y="510" text-anchor="middle"
        font-family="Georgia, serif" font-size="13" fill="#6b7280">
    ${date} · Eureka Lab AI Literacy Platform
  </text>
</svg>`;
}
