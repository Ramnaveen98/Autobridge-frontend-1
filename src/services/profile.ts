import { api } from "./client";
export type Profile = { id:number; email:string; firstName?:string; lastName?:string; phone?:string };
export type ProfileUpdate = { firstName?:string; lastName?:string; phone?:string };

export const profileApi = {
  me: async (): Promise<Profile> => (await api.get("/api/v1/profile")).data,
  update: async (p: ProfileUpdate): Promise<Profile> => (await api.put("/api/v1/profile", p)).data
};
