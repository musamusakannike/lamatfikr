export interface AdminOverviewResponse {
  users: {
    total: number;
    online: number;
    banned: number;
  };
  visits: {
    today: number;
    month: number;
  };
  posts: {
    total: number;
    today: number;
    month: number;
  };
  comments: {
    total: number;
    today: number;
    month: number;
  };
  communities: {
    total: number;
  };
  roomChats: {
    total: number;
  };
  generatedAt: string;
}
