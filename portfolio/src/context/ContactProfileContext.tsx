import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchCurrentContactProfile, type ContactProfile } from '../api/users';

type ContactProfileState = {
	profile: ContactProfile | null;
	loading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
};

const ContactProfileContext = createContext<ContactProfileState | undefined>(undefined);

export const ContactProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { user } = useAuth();
	const [profile, setProfile] = useState<ContactProfile | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const loadProfile = useCallback(async () => {
		if (!user) {
			setProfile(null);
			setError(null);
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const result = await fetchCurrentContactProfile();
			setProfile(result);
		} catch (err) {
			console.error('No se pudo cargar el perfil del usuario logueado', err);
			const message = err instanceof Error ? err.message : 'No se pudo cargar el perfil del usuario.';
			setProfile(null);
			setError(message);
		} finally {
			setLoading(false);
		}
	}, [user?.id]);

	useEffect(() => {
		void loadProfile();
	}, [loadProfile]);

	const value = useMemo<ContactProfileState>(
		() => ({ profile, loading, error, refresh: loadProfile }),
		[profile, loading, error, loadProfile]
	);

	return <ContactProfileContext.Provider value={value}>{children}</ContactProfileContext.Provider>;
};

export const useContactProfile = () => {
	const context = useContext(ContactProfileContext);
	if (!context) {
		throw new Error('useContactProfile must be used within ContactProfileProvider');
	}
	return context;
};
