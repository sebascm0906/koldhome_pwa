"use server";
import { callKw } from "@/lib/odoo";

export async function getLoyaltyRewards() {
  try {
    const rewards = await callKw('loyalty.reward', 'search_read', [[['program_id', '=', 2]]], {
      fields: ['id', 'description', 'reward_type', 'required_points', 'discount', 'discount_max_amount'],
    });
    return rewards;
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return [];
  }
}
