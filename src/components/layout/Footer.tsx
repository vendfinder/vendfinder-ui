import Link from "next/link";
import Image from "next/image";
import { footerLinkHrefs } from "@/data/site";
import { getTranslations } from "next-intl/server";
import LocaleSwitcher from "@/components/ui/LocaleSwitcher";

export default async function Footer() {
  const t = await getTranslations();

  return (
    <footer className="hidden lg:block bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/logo.png"
                alt={t("common.appName")}
                width={36}
                height={36}
                className="rounded-md"
              />
              <span className="text-lg font-bold text-foreground tracking-tight">
                {t("common.appName")}
              </span>
            </div>
            <p className="text-muted text-sm leading-relaxed">
              {t("metadata.description")}
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
              {t("footer.shop")}
            </h3>
            <ul className="space-y-2.5">
              {footerLinkHrefs.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted hover:text-primary transition-colors"
                  >
                    {t(`footer.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
              {t("footer.company")}
            </h3>
            <ul className="space-y-2.5">
              {footerLinkHrefs.company.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted hover:text-primary transition-colors"
                  >
                    {t(`footer.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">
              {t("footer.support")}
            </h3>
            <ul className="space-y-2.5">
              {footerLinkHrefs.support.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted hover:text-primary transition-colors"
                  >
                    {t(`footer.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted">
            {t("common.copyright", {
              year: new Date().getFullYear(),
              appName: t("common.appName"),
              rights: t("common.allRightsReserved"),
            })}
          </p>
          <div className="flex items-center gap-6">
            <LocaleSwitcher />
            <Link
              href="/privacy"
              className="text-sm text-muted hover:text-primary transition-colors"
            >
              {t("common.privacyPolicy")}
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted hover:text-primary transition-colors"
            >
              {t("common.termsOfService")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
