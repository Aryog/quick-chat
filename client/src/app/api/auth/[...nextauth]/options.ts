import { Account, AuthOptions, ISODateString, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import axios, { AxiosError } from "axios";
import { LOGIN_URL } from "@/lib/apiAuthRoutes";
import { redirect } from "next/navigation";

export interface CustomSession {
	user?: CustomUser;
	expires: ISODateString;
}
export interface CustomUser {
	id?: string | null;
	name?: string | null;
	email?: string | null;
	image?: string | null;
	provider?: string | null;
	token?: string | null;
}
export const authOptions: AuthOptions = {
	pages: {
		signIn: "/",
	},
	callbacks: {
		async signIn({ user, account }: { user: CustomUser; account: Account | null }) {
			try {
				console.log('Attempting to connect to:', LOGIN_URL);

				const payload = {
					email: user.email!,
					name: user.name!,
					oauth_id: account?.providerAccountId!,
					provider: account?.provider!,
					image: user?.image,
				};

				console.log('Sending payload:', payload);

				const { data } = await axios.post(LOGIN_URL, {
					...payload,
				}, {
					headers: {
						'Content-Type': 'application/json',
					},
					// Add timeout to catch connection issues
					timeout: 5000,
				});

				console.log('Response received:', data);

				if (!data?.user?.id) {
					console.error('Invalid response structure:', data);
					throw new Error('Invalid response from login API');
				}

				user.id = data.user.id.toString();
				user.token = data.user.token;
				return true;

			} catch (error) {
				console.error('Login error:', {
					url: LOGIN_URL,
					error: error instanceof AxiosError ? {
						message: error.message,
						response: error.response?.data,
						status: error.response?.status,
						config: {
							url: error.config?.url,
							method: error.config?.method,
						}
					} : error
				});

				if (error instanceof AxiosError && error.code === 'ECONNREFUSED') {
					throw new Error('Unable to connect to authentication server');
				}

				if (error instanceof AxiosError) {
					const errorMessage = error.response?.data?.message || error.message;
					throw new Error(`Login failed: ${errorMessage}`);
				}

				throw new Error("Something went wrong. Please try again!");
			}
		},

		async jwt({ token, user }) {
			if (user) {
				token.user = user;
			}
			return token;
		},

		async session({
			session,
			token,
		}: {
			session: CustomSession;
			token: JWT;
		}) {
			session.user = token.user as CustomUser;
			return session;
		},
	},

	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			authorization: {
				params: {
					prompt: "consent",
					access_type: "offline",
					response_type: "code",
				},
			},
		}),
	],
};
