export interface NgoOrganization {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  website?: string;
  impact_area?: string;
}

export interface VoteAllocation {
  organization_id: string;
  votes: number; // Final votes (sqrt(cost))
  cost: number;  // Quadratic cost (votes^2)
}

export interface VotingProfile {
  voice_credits: number;
  has_voted: boolean;
}
