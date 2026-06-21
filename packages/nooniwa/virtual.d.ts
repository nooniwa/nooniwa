declare module "virtual:nooniwa/config" {
  const config: import("./types").NooniwaConfig;
  export default config;
}

declare module "virtual:nooniwa/styles" {}

declare module "virtual:nooniwa/components/Page" {
  const Page: typeof import("./components/Page.astro").default;
  export default Page;
}

declare module "virtual:nooniwa/components/PageFrame" {
  const PageFrame: typeof import("./components/PageFrame.astro").default;
  export default PageFrame;
}

declare module "virtual:nooniwa/components/PageLeft" {
  const PageLeft: typeof import("./components/PageLeft.astro").default;
  export default PageLeft;
}

declare module "virtual:nooniwa/components/PageMain" {
  const PageMain: typeof import("./components/PageMain.astro").default;
  export default PageMain;
}

declare module "virtual:nooniwa/components/FolderTree" {
  const FolderTree: typeof import("./components/FolderTree.astro").default;
  export default FolderTree;
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

declare module "virtual:nooniwa/components/PageAfterBody" {
  const PageAfterBody: typeof import("./components/PageAfterBody.astro").default;
  export default PageAfterBody;
}

declare module "virtual:nooniwa/components/Backlinks" {
  const Backlinks: typeof import("./components/Backlinks.astro").default;
  export default Backlinks;
}

declare module "virtual:nooniwa/components/Header" {
  const Header: typeof import("./components/Header.astro").default;
  export default Header;
}

declare module "virtual:nooniwa/components/Footer" {
  const Footer: typeof import("./components/Footer.astro").default;
  export default Footer;
}

declare module "virtual:nooniwa/components/SiteTitle" {
  const SiteTitle: typeof import("./components/SiteTitle.astro").default;
  export default SiteTitle;
}

declare module "virtual:nooniwa/components/SkipLink" {
  const SkipLink: typeof import("./components/SkipLink.astro").default;
  export default SkipLink;
}
