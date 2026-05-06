import { Injectable, Logger } from '@nestjs/common';
import type { TenantUiModeLock } from '@eureka-lab/shared-types';
import { FirebaseService } from '../../infrastructure/firebase/firebase.service';

/**
 * Service for managing tenant-level configuration in Firestore.
 * Tenants are B2B education clients whose settings can override individual user preferences.
 */
@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);
  private readonly collection = 'tenants';

  constructor(private readonly firebase: FirebaseService) {}

  /**
   * Get the UI mode lock configuration for a tenant.
   * @param tenantId - Tenant document ID
   * @returns TenantUiModeLock or null if not configured
   */
  async getUiModeLock(tenantId: string): Promise<TenantUiModeLock | null> {
    const doc = await this.firebase.firestore.collection(this.collection).doc(tenantId).get();
    if (!doc.exists) return null;
    const data = doc.data() as { uiModeLock?: TenantUiModeLock };
    return data.uiModeLock ?? null;
  }

  /**
   * Set the UI mode lock configuration for a tenant.
   * Creates the tenant document if it does not exist.
   * @param tenantId - Tenant document ID
   * @param lock - UI mode lock to persist
   */
  async setUiModeLock(tenantId: string, lock: TenantUiModeLock): Promise<void> {
    await this.firebase.firestore
      .collection(this.collection)
      .doc(tenantId)
      .set({ uiModeLock: lock }, { merge: true });
    this.logger.log({ event: 'tenant_ui_mode_lock_updated', tenantId, lock });
  }
}
