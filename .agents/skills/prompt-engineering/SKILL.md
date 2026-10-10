---
name: customaize-agent:prompt-engineering
description: Use this skill when writing commands, hooks, skills for Agent, or prompts for sub agents or any other LLM interaction, including optimizing prompts, improving LLM outputs, or designing production prompt templates.
---

# Prompt Engineering Patterns

Advanced prompt engineering techniques to maximize LLM performance, reliability, and controllability.

## Core Capabilities

### 1. Few-Shot Learning
Teach the model by showing examples instead of explaining rules. Include 2-5 input-output pairs that demonstrate the desired behavior. Use when you need consistent formatting, specific reasoning patterns, or handling of edge cases. More examples improve accuracy but consume tokens—balance based on task complexity.

### 2. Chain-of-Thought Prompting
Request step-by-step reasoning before the final answer. Add "Let's think step by step" (zero-shot) or include example reasoning traces (few-shot). Use for complex problems requiring multi-step logic, mathematical reasoning, or when you need to verify the model's thought process. Improves accuracy on analytical tasks by 30-50%.

### 3. Prompt Optimization
Systematically improve prompts through testing and refinement. Start simple, measure performance (accuracy, consistency, token usage), then iterate. Test on diverse inputs including edge cases. Use A/B testing to compare variations. Critical for production prompts where consistency and cost matter.

### 4. Template Systems
Build reusable prompt structures with variables, conditional sections, and modular components. Use for multi-turn conversations, role-based interactions, or when the same pattern applies to different inputs. Reduces duplication and ensures consistency across similar tasks.

### 5. System Prompt Design
Set global behavior and constraints that persist across the conversation. Define the model's role, expertise level, output format, and safety guidelines. Use system prompts for stable instructions that shouldn't change turn-to-turn, freeing up user message tokens for variable content.

## Key Patterns
- **Progressive Disclosure**: Level 1 (Direct instruction) → Level 2 (Add constraints) → Level 3 (Add reasoning) → Level 4 (Add examples).
- **Instruction Hierarchy**: `[System Context] → [Task Instruction] → [Examples] → [Input Data] → [Output Format]`.
- **Error Recovery**: Include fallbacks, confidence scoring, alternative interpretations.

## Persuasion Principles for Agent Communication
1. **Authority**: Imperative language ("YOU MUST", "Never", "Always") for discipline enforcement.
2. **Commitment**: Consistency, tracking, explicit announcements.
3. **Scarcity**: Urgency, sequential dependencies ("Before proceeding", "Immediately after X").
4. **Social Proof**: Universal norms ("Every time", "Always").
5. **Unity**: Shared goals ("our codebase", "we're colleagues").
