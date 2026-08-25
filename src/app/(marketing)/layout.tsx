import SiteForms from "@/components/SiteForms";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta
          name="viewport"
          content="initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, width=device-width, height=device-height, target-densitydpi=device-dpi"
        />

        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Raleway:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />

        <link href="/aos/aos.css" rel="stylesheet" />
        <link href="/css/bootstrap.min.css" rel="stylesheet" />
        <link href="/owlcarousel/assets/owl.carousel.css" rel="stylesheet" />
        <link rel="stylesheet" href="/owlcarousel/assets/owl.theme.default.min.css" />

        <link href="https://www.convergenceindia.org/css/fontawesome-Pro-5.15.3.css" rel="stylesheet" />

        <link href="/css/my-style.css" rel="stylesheet" />

        <link rel="shortcut icon" href="/favicon.ico" title="Favicon" />
      </head>
      <body>
        {children}
        <SiteForms />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
