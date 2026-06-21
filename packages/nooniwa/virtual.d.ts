declare module "virtual:nooniwa/config" {
  const config: import("./types").NooniwaConfig;
  export default config;
}

declare module "virtual:nooniwa/styles" {}

declare module "virtual:nooniwa/components/Page" {
  const Page: typeof import("./components/Page.astro").default;
  export default Page;
}

declare module "virtual:nooniwa/components/PageMain" {
  const PageMain: typeof import("./components/PageMain.astro").default;
  export default PageMain;
}

declare module "virtual:nooniwa/components/PageBody" {
  const PageBody: typeof import("./components/PageBody.astro").default;
  export default PageBody;
}

declare module "virtual:nooniwa/components/PageBeforeBody" {
  const PageBeforeBody: typeof import("./components/PageBeforeBody.astro").default;
  export default PageBeforeBody;
}

declare module "virtual:nooniwa/components/PageTitle" {
  const PageTitle: typeof import("./components/PageTitle.astro").default;
  export default PageTitle;
}

declare module "virtual:nooniwa/components/PageMetadata" {
  const PageMetadata: typeof import("./components/PageMetadata.astro").default;
  export default PageMetadata;
}

declare module "virtual:nooniwa/components/SkipLink" {
  const SkipLink: typeof import("./components/SkipLink.astro").default;
  export default SkipLink;
}
