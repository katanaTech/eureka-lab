'use client';

interface CertificateScreenProps {
  /** Signed Firebase Storage URL pointing to the SVG certificate */
  certificateUrl: string;
  /** XP awarded for the overlord victory (0 if not yet loaded) */
  xpAwarded: number;
  /** Badge IDs unlocked during the battle */
  badgesUnlocked: string[];
  /** Called when the player navigates back to the world */
  onBack: () => void;
}

/**
 * AI Literacy Champion certificate screen displayed after defeating the Anti-AI Overlord.
 * Renders the server-generated SVG certificate, an XP/badge summary row, a download
 * link, and a "Back to World" button.
 *
 * The `<img>` tag is intentional — the certificate is an SVG from Firebase Storage,
 * not a Next.js-optimisable image (external, signed URL). The eslint disable comment
 * suppresses the @next/next/no-img-element warning for this valid exception.
 *
 * @param certificateUrl - Signed URL for the SVG certificate image
 * @param xpAwarded - Total XP earned from the overlord battle
 * @param badgesUnlocked - Array of badge IDs to show the count
 * @param onBack - Navigation callback to return to the world map
 */
export function CertificateScreen({
  certificateUrl,
  xpAwarded,
  badgesUnlocked,
  onBack,
}: CertificateScreenProps) {
  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center gap-8 bg-gray-950 p-6">
      {/* Hero */}
      <div className="text-center">
        <p className="mb-2 text-6xl">🏆</p>
        <h1 className="text-4xl font-black text-yellow-400">AI LITERACY CHAMPION!</h1>
        <p className="mt-2 text-gray-400">
          You defeated the Anti-AI Overlord and completed all four islands!
        </p>
      </div>

      {/* XP + badge counts */}
      {xpAwarded > 0 && (
        <div className="flex items-center gap-6">
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-900/20 px-6 py-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-600">
              XP Earned
            </p>
            <p className="text-3xl font-black text-yellow-400">+{xpAwarded}</p>
          </div>
          {badgesUnlocked.length > 0 && (
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-900/20 px-6 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                Badges
              </p>
              <p className="text-3xl font-black text-indigo-300">{badgesUnlocked.length}</p>
            </div>
          )}
        </div>
      )}

      {/* Certificate preview */}
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-yellow-500/20 shadow-2xl shadow-yellow-900/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={certificateUrl}
          alt="AI Literacy Champion certificate"
          className="w-full"
          loading="eager"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <a
          href={certificateUrl}
          download="ai-champion-certificate.svg"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-yellow-500 bg-yellow-900/30 px-8 py-3 text-base font-bold text-yellow-400 transition-all hover:bg-yellow-900/60"
        >
          Download Certificate
        </a>
        <button
          onClick={onBack}
          className="rounded-2xl bg-indigo-600 px-8 py-3 text-base font-bold text-white transition-all hover:bg-indigo-500"
        >
          Back to World
        </button>
      </div>
    </div>
  );
}
