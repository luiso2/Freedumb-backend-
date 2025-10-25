// config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import mongoose from 'mongoose';

// Import User model
const User = mongoose.models.User || mongoose.model('User');

/**
 * Configure Passport Google OAuth 2.0 Strategy
 *
 * This strategy authenticates users using their Google account.
 * OAuth 2.0 flow:
 * 1. User clicks "Login with Google"
 * 2. Redirected to Google's OAuth consent screen
 * 3. User approves access
 * 4. Google redirects back with authorization code
 * 5. Strategy exchanges code for access token
 * 6. Strategy retrieves user profile from Google
 * 7. Callback function processes the profile
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Extract user information from Google profile
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const displayName = profile.displayName || 'Unknown User';

        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        // Check if user already exists
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
          // User exists - update Google profile info if needed
          if (!user.googleId) {
            user.googleId = profile.id;
            user.authProvider = 'google';
            await user.save();
          }

          // Update last login
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                lastLogin: new Date(),
                'metadata.lastLoginIP': req.ip
              },
              $inc: {
                'metadata.loginCount': 1
              }
            }
          );

          return done(null, user);
        }

        // User doesn't exist - create new user
        user = await User.create({
          name: displayName,
          email: email.toLowerCase(),
          username: email.split('@')[0] + '_' + Math.random().toString(36).substring(7),
          password: 'google_oauth_' + Math.random().toString(36).substring(2), // Random password (won't be used)
          googleId: profile.id,
          authProvider: 'google',
          role: 'user',
          isActive: true,
          lastLogin: new Date(),
          metadata: {
            lastLoginIP: req.ip,
            loginCount: 1
          }
        });

        return done(null, user);

      } catch (error) {
        console.error('Google OAuth Strategy Error:', error);
        return done(error, null);
      }
    }
  )
);

/**
 * Serialize user to session
 * Stores only the user ID in the session
 */
passport.serializeUser((user, done) => {
  done(null, user._id);
});

/**
 * Deserialize user from session
 * Retrieves full user object using the ID from session
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
