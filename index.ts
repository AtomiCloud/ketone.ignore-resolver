import { type ResolverOutput, StartResolverWithLambda, type ResolverInput } from '@atomicloud/cyan-sdk';

StartResolverWithLambda(async (input: ResolverInput): Promise<ResolverOutput> => {
  const { config, files } = input;
  // Process files and return resolved output
  // Note: Resolver returns a single output; the engine may call this multiple times
  const file = files[0];
  return {
    path: file?.path ?? '',
    content: file?.content ?? '',
  };
});
