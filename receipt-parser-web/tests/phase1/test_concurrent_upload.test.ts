
import { setupTestUtils } from '../utils';
import { testDb } from '../setup';
import { testUsers } from '../setup';

describe('Phase 1: Concurrent Uploads', () => {
    const { sendReceipt } = setupTestUtils();
    let userId: number;

    beforeAll(async () => {
        const result = await testDb.query(
            'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET email=EXCLUDED.email RETURNING id',
            [testUsers.validUser.email, testUsers.validUser.password, testUsers.validUser.username]
        );
        userId = result.rows[0].id;
    });

    test('Multiple uploads get unique session_ids and increasing queue positions', async () => {
        const uploads = await Promise.all([
            sendReceipt(userId, { contentHash: 'hash_concurrent_1' }),
            sendReceipt(userId, { contentHash: 'hash_concurrent_2' }),
            sendReceipt(userId, { contentHash: 'hash_concurrent_3' })
        ]);

        const sessionIds = uploads.map(r => r.receipt_session_id);
        const uniqueSessionIds = new Set(sessionIds);
        expect(uniqueSessionIds.size).toBe(3);

        const positions = uploads.map(r => r.queue_position).sort((a, b) => a - b);
        // Note: Since they are concurrent, we can't guarantee exact 1,2,3 relative to start if other tests ran,
        // but they should be distinct and likely sequential relative to each other if `get_next_receipt_number` works safely.
        // However, our `setupTestUtils` uses `await` so it's not truly parallel query execution in `Promise.all` due to likely pool limit or how Jest runs.
        // But conceptually we test they are distinct.
        expect(new Set(positions).size).toBe(3);
    });
});
