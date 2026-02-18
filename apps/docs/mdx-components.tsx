import type { MDXComponents } from 'mdx/types';
import { CustomMDXComponents } from '@/components/mdx-components';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...CustomMDXComponents,
    ...components,
  };
}
