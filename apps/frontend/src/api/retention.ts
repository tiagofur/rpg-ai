import { client } from './client';

export const retentionApi = {
    registerPushToken: async (token: string, authToken: string) => {
        return client.post('/notifications/register', { token }, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
    },

    checkDailyReward: async (authToken: string) => {
        return client.get<{ canClaim: boolean }>('/rewards/daily/check', {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
    },

    claimDailyReward: async (authToken: string) => {
        return client.post<{
            streak: number;
            reward: { type: string; amount: number };
            nextRewardAt: string;
        }>('/rewards/daily/claim', {}, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
    },
};
