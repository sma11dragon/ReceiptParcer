
import { setupTestUtils } from '../utils';
import { testDb } from '../setup';
import { testUsers } from '../setup';

describe('Phase 1: Edge Cases', () => {
    const { sendReceipt } = setupTestUtils();
    let userId: number;

    beforeAll(async () => {
        const result = await testDb.query(
            'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET email=EXCLUDED.email RETURNING id',
            [testUsers.validUser.email, testUsers.validUser.password, testUsers.validUser.username]
        );
        userId = result.rows[0].id;
    });

    test('Robustly handles duplicate content hash if constraint not yet enforced (Phase 1)', async () => {
        // In Phase 1 we added content_hash but didn't enforce UNIQUE constraint yet (that comes later/or if we did, we should test it fails)
        // The migration says "CREATE INDEX ... content_hash" but not unique constraint on column definition.

        const r1 = await sendReceipt(userId, { contentHash: 'hash_dup_1' });
        const r2 = await sendReceipt(userId, { contentHash: 'hash_dup_1' });

        expect(r1.receipt_session_id).not.toBe(r2.receipt_session_id);
        expect(r1.content_hash).toBe(r2.content_hash);
    });
});
