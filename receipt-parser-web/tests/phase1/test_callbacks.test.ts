
import { setupTestUtils } from '../utils';
import { testDb } from '../setup';
import { testUsers } from '../setup';

describe('Phase 1: Callbacks', () => {
    const { sendReceipt, clickButton } = setupTestUtils();
    let userId: number;

    beforeAll(async () => {
        const result = await testDb.query(
            'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET email=EXCLUDED.email RETURNING id',
            [testUsers.validUser.email, testUsers.validUser.password, testUsers.validUser.username]
        );
        userId = result.rows[0].id;
    });

    test('Callback routing finds correct receipt by session_id', async () => {
        const receipt = await sendReceipt(userId, { contentHash: 'hash_callback_1' });
        const sessionId = receipt.receipt_session_id;

        const retrievedReceipt = await clickButton(sessionId, 'fix_cat');

        expect(retrievedReceipt).toBeDefined();
        expect(retrievedReceipt.id).toBe(receipt.id);
        expect(retrievedReceipt.content_hash).toBe('hash_callback_1');
    });
});
