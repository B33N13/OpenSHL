import { z } from 'zod';

export const TrackEnum = z.enum([
  'banking', 'retail', 'healthcare', 'mining', 'public_sector', 'logistics'
]);
export const DifficultyEnum = z.enum(['easy', 'medium', 'hard']);
const OptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
  whyWrong: z.string().optional()
});
export const NumericalQuestionSchema = z.object({
  id: z.string(),
  track: TrackEnum,
  type: z.literal('numerical'),
  difficulty: DifficultyEnum,
  stem: z.string(),
  table: z.object({
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string()))
  }).optional(),
  question: z.string(),
  options: z.array(OptionSchema).length(4),
  explanation: z.string(),
  trapTags: z.array(z.string()).optional()
});
export const VerbalQuestionSchema = z.object({
  id: z.string(),
  track: TrackEnum,
  type: z.literal('verbal'),
  difficulty: DifficultyEnum,
  passage: z.string(),
  statements: z.array(z.object({
    statement: z.string(),
    answer: z.enum(['true', 'false', 'cannot_say']),
    justification: z.string()
  })).min(1)
});
export const InductiveQuestionSchema = z.object({
  id: z.string(),
  track: TrackEnum,
  type: z.literal('inductive'),
  difficulty: DifficultyEnum,
  sequence: z.array(z.string()),
  options: z.array(OptionSchema).length(4),
  explanation: z.string()
});
export const DeductiveQuestionSchema = z.object({
  id: z.string(),
  track: TrackEnum,
  type: z.literal('deductive'),
  difficulty: DifficultyEnum,
  premises: z.array(z.string()).min(2),
  conclusion: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.enum(['Conclusion follows', 'Conclusion does not follow', 'Cannot say']),
    isCorrect: z.boolean()
  })).length(3),
  explanation: z.string()
});
export const SJTQuestionSchema = z.object({
  id: z.string(),
  track: TrackEnum,
  type: z.literal('sjt'),
  difficulty: DifficultyEnum,
  scenario: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    effectiveness: z.enum(['most', 'least', 'neutral']),
    rationale: z.string()
  })).length(4),
  explanation: z.string()
});
export const QuestionSchema = z.discriminatedUnion('type', [
  NumericalQuestionSchema,
  VerbalQuestionSchema,
  InductiveQuestionSchema,
  DeductiveQuestionSchema,
  SJTQuestionSchema
]);

export type Track = z.infer<typeof TrackEnum>;
export type Question = z.infer<typeof QuestionSchema>;
