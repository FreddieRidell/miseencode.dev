---
title: Make the Change Easy, Then Make the Change
subtitle: Rare universal coding advice
---

There have been many attempts to produce universal advice for writing code.

- **Don't Repeat Yourself:** Fine in general, but over application leads to overeager generalisation of actually separated ideas.
- **"Clean" Code:** Ephemeral and ill defined, half the advice in "Uncle" Bob's book is only applicable to OOP, half is actively unhelpful, and very little is usefully universal.
- **Test Driven Development:** Automated tests are an invaluable tool, and it's often helpful to write tests before your implementation. But the idea that you should _always_ write tests first, or that your tests are more valuable than your implementation is counterintuitive because it's not true.

I can only think of one piece of advice I've received that I've never regretted applying and wanted to pass on to others.

## Make the Change Easy, Then Make the Change

If you have to make a change to the behaviour of the code that seems difficult, and the current architecture doesn't easily accommodate the new behaviour; your first move should be to refactor the codebase so that your change is easy. It's unusually sensible to split this into _at least_ a separate commit, maybe even a separate PR, so it's clear which bit is the refactor, and which is the behaviour change.

I've not yet encountered an instance where refactoring a system to more easily support a change resulted in a worse outcome than trying to implement the new behaviour in a system where it doesn't fit.^[In fact, in rereading that sentence it seems tautologically obvious. Obviously a codebase will be better if its architecture is refactored to match the behaviour it should exhibit.]

## What This Means

It isn't possible to fully and correctly design the architecture of a codebase up front. It's not the sort of thing humans are good at, and even if they were, requirements change over time, invalidating previous assumptions. One will inevitably encounter some change to the behaviour of a codebase that isn't easily supported by its current architecture. We've all added a flag, jammed in an extra toggle, or something that we can "feel" makes the code "worse" just to get a ticket closed.

We should take advantage of a quality that differentiates software from other engineering disciplines: it's trivial and free to redeploy updated versions of our product. Don't be afraid of tearing up the foundation of some system and correcting the assumptions that it was based on.

## Why This Is Good

### Better Final Product

If the architecture aligns to make the behaviour easy, the code will be better. One concept flows neatly into the next and things won't seem to be "fighting" each other. Too often we're beholden to the idea that we should retain our old architectures because they're ones we understand, but how valuable is an understood system that's hard to work with? How much more valuable is a "new" system that's easy to understand? Save your institutional knowledge budget for understanding external complexities not, understanding your own system.

### Easier Changes next Time

Similar to [the Lindy Effect][LindyEffect], if you're making 1 change that suggests a different architecture, it's likely you're going to want to make more similar changes in future. The original code architecture didn't match the ongoing requirements (that's fine!), it's time to update it so it correctly models the desired function. Make your life easier next time, and get the future changes integrated faster.

## When Not To

Look, man, sometimes you just need to get the ticket merged. The downside to this approach is that it will usually take more time than just jamming a fix in; and sometimes time is the biggest constraint.

The good news is that this advice isn't just applicable when initially making the change. Once you've freed up some time you can go back and "make what the code's doing easy", gaining all the same benefits as if you'd done it properly the first time.

---

[LindyEffect]: https://en.wikipedia.org/wiki/Lindy_effect
