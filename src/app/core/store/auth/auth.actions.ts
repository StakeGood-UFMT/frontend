import { createAction, props } from '@ngrx/store';
import { AuthProfile } from '../../models/auth.model';

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ accessToken: string; refreshToken: string; profile: AuthProfile }>()
);

export const logout = createAction('[Auth] Logout');

export const updateProfile = createAction(
  '[Auth] Update Profile',
  props<{ profile: Partial<AuthProfile> }>()
);
