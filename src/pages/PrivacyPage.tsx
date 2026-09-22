import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const PrivacyPage = () => (
  <div className="min-h-screen gradient-dark">
    <Navbar />
    <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center">
          <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-display font-bold text-3xl text-foreground">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mt-2">
            Last updated: September 2026
          </p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-7 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              1. The information we collect
            </h2>
            <p className="mb-3">
              We collect the information needed to run SCENE, support safe
              nights out, verify venues and keep the community reliable. We only
              ask for information that has a clear purpose in the product.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">
                  Account and profile:
                </strong>{" "}
                Your account ID, email address, username, avatar, bio, points
                and account safety or moderation status.
              </li>
              <li>
                <strong className="text-foreground">Community activity:</strong>{" "}
                Vibes, pulling-up events, follows, favorites, messages, reviews,
                ratings, videos, comments, reactions, club suggestions and
                related activity.
              </li>
              <li>
                <strong className="text-foreground">
                  Device and app information:
                </strong>{" "}
                A device ID used for fair-use and anti-spam checks, local
                storage for session preferences and safety PINs, and push
                subscription details when you enable notifications.
              </li>
              <li>
                <strong className="text-foreground">
                  Venue claim information:
                </strong>{" "}
                Venue details, address, location and geofence data, owner
                contact details, proof documents, verification method, status
                and review history.
              </li>
              <li>
                <strong className="text-foreground">
                  Safety and location:
                </strong>{" "}
                Active safety session coordinates, destination, ETA, battery
                level, last ping time, emergency contacts and the last known
                location needed for an alert.
              </li>
              <li>
                <strong className="text-foreground">
                  Moderation and audit records:
                </strong>{" "}
                Admin actions, affected account IDs, action details and review
                history used to protect the service and investigate abuse.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              2. Location choices and controls
            </h2>
            <p className="mb-3">
              You are in control of location access. SCENE uses GPS when you
              choose a feature that needs it. We do not continuously track your
              location in the background while the app is idle.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Walk Me Home:</strong> When
                you start a safety session, we record your destination, current
                position, battery level and ping times so the session can work.
                The session expires after its configured safety window.
              </li>
              <li>
                <strong className="text-foreground">
                  Shared safety links:
                </strong>{" "}
                Anyone with your safety link may view the session while it is
                active and has not expired. Only share it with someone you
                trust.
              </li>
              <li>
                <strong className="text-foreground">
                  Crew location sharing:
                </strong>{" "}
                You can choose to share your live location with accepted crew
                members. Those coordinates are limited to that crew-sharing
                feature.
              </li>
              <li>
                <strong className="text-foreground">Venue verification:</strong>{" "}
                A venue claim may include latitude, longitude and a geofence
                radius to confirm the business location.
              </li>
            </ul>
            <p className="mt-3">
              You can deny location permission or stop using any location-based
              feature. If you do not start a safety session or share a crew
              location, SCENE does not generate live tracking data for you.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              3. Why we use your information
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To show live venue and crowd information.</li>
              <li>
                To provide messages, reviews, follows, favorites and other
                community features.
              </li>
              <li>
                To review venue claims and keep the SCENE directory trustworthy.
              </li>
              <li>
                To deliver safety alerts, emergency contact notifications and
                live tracking links.
              </li>
              <li>
                To prevent abuse, review reports and enforce community rules.
              </li>
              <li>To send notifications you enable and improve the product.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              4. How we protect your information
            </h2>
            <p>
              We use Supabase Row-Level Security to limit access. Some profile
              and community information is visible in the app because SCENE is a
              social platform. Private account data is limited to you and
              authorized administrators. Venue claims are limited to the
              claimant and authorized administrators. Emergency contacts and
              safety sessions are protected by ownership rules, and admin audit
              logs are restricted to administrators.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              5. Retention and deletion
            </h2>
            <p className="mb-3">
              We keep information only as long as it is needed to provide SCENE,
              protect the community, resolve disputes and meet legitimate legal
              or security needs. Some features have their own expiry rules:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Safety sessions:</strong>{" "}
                Expire automatically at the end of the configured session
                window.
              </li>
              <li>
                <strong className="text-foreground">
                  Venue claim documents:
                </strong>{" "}
                Stay linked to a claim while it is active or under review.
              </li>
              <li>
                <strong className="text-foreground">Audit records:</strong> May
                be kept when needed for security, moderation, dispute handling
                or legal obligations.
              </li>
              <li>
                <strong className="text-foreground">Account deletion:</strong>{" "}
                You can request deletion from the app. The account-deletion flow
                removes your account and associated personal data where
                supported, although limited records may remain when required for
                security or legal reasons.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              6. What we do not do
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>We do not sell your personal information to advertisers.</li>
              <li>
                We do not continuously track your GPS location outside the
                safety and crew-sharing features you choose to use.
              </li>
              <li>
                We do not use your personal information for unrelated marketing
                without your consent.
              </li>
            </ul>
          </section>

          <div className="pt-4 border-t border-border/30">
            <p className="text-center text-muted-foreground">
              We aim to make your choices clear and your information purposeful.
              You can manage location permissions, notification permissions and
              account deletion from the product settings available to you.
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  </div>
);

export default PrivacyPage;
