import { User } from "../models/userModel";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";

dotenv.config();

passport.use( 
    new GoogleStrategy(
        {
         clientID: process.env.GOOGLE_CLIENT_ID! as string,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET! as string,
         callbackURL: process.env.OAUTH_CALLBACK_URL! as string
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({googleId: profile.id});
                let isNewUser = false;
                
                if (!user) {
                    isNewUser = true;
                    user = await User.create({
                        name: profile.displayName,
                        email: profile.emails?.[0]?.value as string,
                        googleId: profile.id,
                        provider: "google",
                        role: "receiver",
                        location: {
                            type: "Point",
                            coordinates: [0, 0]
                        }
                    })
                }
                
                // Attach isNewUser flag to user object for later use
                (user as any).isNewUser = isNewUser;
                return done(null, user);
            }
            catch( error ) {
                return done(error);
            }
        }
    )
)

export default passport;