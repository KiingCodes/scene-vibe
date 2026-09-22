import { motion } from "framer-motion";
import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const TermsPage = () => (
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
          <FileText className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-display font-bold text-3xl text-foreground">
            Terms of Service
          </h1>
          <p className="text-muted-foreground mt-2">
            Last updated: September 2026
          </p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              1. Using SCENE
            </h2>
            <p>
              SCENE is a nightlife discovery, community and safety platform. By
              creating an account or using the app, you agree to these terms and
              to use SCENE responsibly.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              2. Your account
            </h2>
            <p>
              Keep your login details secure and make sure your account
              information is accurate. You are responsible for activity from
              your account, including reviews, messages, vibe actions, safety
              sessions and venue claim submissions.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              3. Community standards
            </h2>
            <p>
              SCENE works best when people share honest, useful information. Do
              not post fake activity, manipulate ratings, spam, harass others,
              impersonate people or attempt to bypass platform limits. We may
              remove content, issue warnings, suspend accounts or take other
              action when these rules are broken.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              4. Safety and location features
            </h2>
            <p>
              Location is collected only for features you choose, such as Walk
              Me Home, crew location sharing or venue verification. These tools
              support your decisions, but they do not replace emergency services
              or personal judgment. Use safety links carefully and share them
              only with people you trust.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              5. Venue claims
            </h2>
            <p>
              Venue owners may submit business details, proof of ownership,
              location information and supporting documents. SCENE may review,
              approve, reject or request changes to a claim. Verification is not
              a guarantee of a venue's quality, safety or continued operation.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              6. Privacy and deletion
            </h2>
            <p>
              Our{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              explains what we collect, how we use it, how location features
              work and how long information is kept. You can request account
              deletion through the app. Some limited records may remain when
              needed for security, dispute resolution or legal obligations.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              7. Fair use
            </h2>
            <p>
              SCENE uses rate limits and other anti-abuse controls to protect
              reliable community data. Do not use bots, duplicate accounts or
              other methods to manipulate activity or bypass these controls.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              8. Content you share
            </h2>
            <p>
              You keep ownership of content you post. By sharing it on SCENE,
              you give us permission to host, display, organize and moderate it
              within the product so we can operate and improve the service.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              9. Information and safety disclaimers
            </h2>
            <p>
              SCENE provides community-driven nightlife information. Crowd
              counts, venue activity, reviews and ratings may be incomplete,
              delayed or inaccurate. SCENE does not guarantee the safety,
              availability or quality of any venue, event, route or person. Use
              your judgment and contact emergency services when you need
              immediate help.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg text-foreground mb-2">
              10. Changes to these terms
            </h2>
            <p>
              We may update these terms as SCENE changes or legal requirements
              develop. We will post the revised terms in the app. Continuing to
              use SCENE after an update means you accept the revised terms.
            </p>
          </section>

          <div className="pt-4 border-t border-border/30">
            <p className="text-center text-muted-foreground">
              Questions about these terms? Contact SCENE through the app.
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  </div>
);

export default TermsPage;
