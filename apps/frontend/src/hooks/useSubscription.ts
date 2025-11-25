import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "../api/client";

export interface Plan {
    id: string;
    name: string;
    description: string;
    pricing: {
        monthly: number;
        yearly: number;
    };
    features: string[];
}

export interface StripeConfig {
    publishableKey: string;
    availablePlans: Plan[];
}

export interface Subscription {
    id: string;
    status: string;
    planId: string;
    currentPeriodEnd: string;
}

export interface CreateSubscriptionResponse {
    subscriptionId: string;
    stripeClientSecret: string;
    status: 'active' | 'incomplete' | 'requires_payment_method' | 'requires_confirmation' | 'requires_action';
}

export function useSubscription() {
    const queryClient = useQueryClient();

    const config = useQuery({
        queryKey: ["stripeConfig"],
        queryFn: async () => {
            const response = await client.get<StripeConfig>("/stripe/config");
            return response.data;
        },
    });

    const subscription = useQuery({
        queryKey: ["subscription"],
        queryFn: async () => {
            const response = await client.get<{ data: { subscription: Subscription | null } }>("/stripe/subscription");
            return response.data.data?.subscription;
        },
    });

    const createSubscription = useMutation({
        mutationFn: async (data: { plan: string; billingInterval: string; paymentMethodId: string }) => {
            const response = await client.post<CreateSubscriptionResponse>("/stripe/create-subscription", data);
            return response.data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["subscription"] });
        },
    });

    return {
        config,
        subscription,
        createSubscription,
    };
}
