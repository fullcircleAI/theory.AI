# Testing Context-Aware Results Page

## How to Test

### Test Scenario 1: Score < 60% (Critical)
1. Complete a practice test
2. Get a score below 60% (e.g., 4/10 = 40%)
3. **Expected Result:**
   - Primary button: "Retry Test" (red gradient, large)
   - Secondary: "Next: [Test Name]" (if next test available)
   - Secondary: "Go to Dashboard"

### Test Scenario 2: Score 60-79% (Needs Work)
1. Complete a practice test
2. Get a score between 60-79% (e.g., 7/10 = 70%)
3. **Expected Result:**
   - Primary button: "Next Test: [Name]" (green gradient, large)
   - Secondary: "Retry Test" (amber outline)
   - Secondary: "Go to Dashboard" (if next test exists)

### Test Scenario 3: Score ≥ 80% (Mastery)
1. Complete a practice test
2. Get a score 80% or higher (e.g., 9/10 = 90%)
3. **Expected Result:**
   - Primary button: "Next Test: [Name]" (green gradient, enhanced shadow)
   - Secondary: "Go to Dashboard" (if next test exists)

## What to Check

### Visual Design
- [ ] Primary button is large and prominent (56px height)
- [ ] Primary button has gradient background
- [ ] Secondary buttons are outlined style
- [ ] Colors match context (green/amber/red/blue)
- [ ] Buttons show test names when available

### Functionality
- [ ] "Next Test" button navigates to correct test
- [ ] "Retry Test" button restarts current test
- [ ] "Go to Dashboard" navigates to dashboard
- [ ] All buttons are clickable and responsive

### Mobile
- [ ] Buttons are full-width on mobile
- [ ] Touch targets are at least 44px
- [ ] Proper spacing between buttons
- [ ] Text is readable

### Animations
- [ ] Hover effects work (button lifts slightly)
- [ ] Arrow icon animates on hover
- [ ] Active state works (button presses down)

## Quick Test Steps

1. **Open app**: http://localhost:3000
2. **Start any practice test**
3. **Answer questions** (intentionally get some wrong for lower scores)
4. **Complete test** and check results page
5. **Verify buttons** match expected behavior for your score

## Expected Button Labels

- **Next Test Button**: "Next Test: [Actual Test Name]"
  - Example: "Next Test: Priority Rules"
  - Example: "Next Test: Hazard Perception"

- **Retry Button**: "Retry Test"

- **Dashboard Button**: "Go to Dashboard"

## Color Guide

- **Green** (#10b981): Next Test (success/continue)
- **Amber** (#f59e0b): Retry (warning/needs work)
- **Red** (#ef4444): Retry Critical (must retry)
- **Blue** (#3b82f6): Dashboard (neutral)

---

**Test it now and verify the context-aware buttons work correctly!**


