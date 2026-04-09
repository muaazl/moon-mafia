export interface UserResponse {
    id: number;
    name: string;
    age: number;
    gender: string;
    capital: number;
    games_played: number;
    total_wins: number;
    total_losses: number;
    total_rounds: number;
    heart_mode_wins: number;
    carrot_mode_wins: number;
    security_question?: string;
    avatar_url?: string;
    has_seen_tutorial: boolean;
}

export interface FetchResponse {
    image_url: string;
    capital: number;
    difficulty_seconds: number;
    streak: number;
}

export interface ActionResponse {
    outcome: string;
    detail: string;
    capital: number;
    hearts: number | null;
    carrots: number | null;
    streak: number;
}

export interface AuditResponse {
    audit_cost: number;
    capital: number;
}

export interface MiniResponse {
    outcome: string;
    detail: string;
    capital: number;
    no_reason: string | null;
    hearts: number | null;
    carrots: number | null;
}

export interface SummaryResponse {
    name: string;
    capital: number;
    net_change: number;
    games_played: number;
    total_wins: number;
    total_losses: number;
    total_rounds: number;
    win_rate_pct: number;
    heart_mode_wins: number;
    carrot_mode_wins: number;
  avatar_url?: string;
}

export interface TipResponse {
    sender_capital: number;
    detail: string;
}
