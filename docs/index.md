---
layout: home

hero:
  image:
    light: /bintastic-banner.png
    dark: /bintastic-banner-dark.png
    alt: bintastic
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /api/

features:
  - icon:
      light: /bintastic-icon.svg
      dark: /bintastic-icon-dark.svg
      width: '28'
      height: '28'
    title: Real subprocess execution
    details: Spawns your CLI as a real subprocess with execa, so your tests exercise the binary your users actually run—argument parsing, exit codes, stdout and stderr—rather than a mocked import.
  - icon:
      light: https://api.iconify.design/lucide/folder-tree.svg?color=%2313a89a
      dark: https://api.iconify.design/lucide/folder-tree.svg?color=%232dd4bf
      width: '28'
      height: '28'
    title: Fixture-based project setup
    details: Every test gets a throwaway temp directory backed by fixturify-project. Declare the files your CLI should see, write them to disk, and let bintastic tear everything down afterward.
  - icon:
      light: https://api.iconify.design/lucide/bug.svg?color=%2313a89a
      dark: https://api.iconify.design/lucide/bug.svg?color=%232dd4bf
      width: '28'
      height: '28'
    title: Built-in debugging
    details: Flip the BINTASTIC_DEBUG environment variable to attach the Node inspector and preserve fixtures on disk, or call runBinDebug to debug a single invocation.
  - icon:
      light: https://api.iconify.design/lucide/blocks.svg?color=%2313a89a
      dark: https://api.iconify.design/lucide/blocks.svg?color=%232dd4bf
      width: '28'
      height: '28'
    title: Runner agnostic
    details: bintastic only manages setup, teardown, and running the binary, so it drops into vitest, jest, or any other test runner without ceremony.
---
