# 🧪 Testing Dynamic Mock Exam

## ✅ **How Dynamic Mock Exams Work:**

1. **Requires 3+ practice tests** - `shouldPersonalizeMockExam()` returns true
2. **Analyzes weak areas** - Topics with score < 60%
3. **Selects questions from weak areas** - 60% from weak, 30% medium, 10% strong
4. **Prevents repeats** - Won't show questions seen in last 7 days
5. **Adjusts difficulty** - Based on recent performance trends

---

## 🧪 **How to Test:**

### **Step 1: Check if Personalization is Enabled**

1. Open browser console: `Cmd + Option + C` (Safari)
2. Go to Mock Exam selection page
3. Look for personalization toggle
4. Check localStorage:
   ```javascript
   localStorage.getItem('mockExamPersonalization')
   // Should be 'true' or null (defaults to true)
   ```

### **Step 2: Check if You Have Enough Test History**

1. In browser console, check:
   ```javascript
   // Check test history count
   const history = JSON.parse(localStorage.getItem('testHistory') || '[]');
   console.log('Test history count:', history.length);
   console.log('Should personalize:', history.length >= 3);
   ```

### **Step 3: Start a Mock Exam**

1. Go to Mock Exam selection
2. Select any exam
3. Click "Start Exam"
4. **Check browser console** for logs:
   ```
   Mock exam mock-exam1 using personalized questions: {
     total: 50,
     focusAreas: ["Priority Rules", "Hazard Perception"],
     personalizationLevel: 75,
     difficultyDistribution: { easy: 10, medium: 25, hard: 15 }
   }
   ```

### **Step 4: Verify Personalization**

**If Personalized:**
- ✅ Console shows: "using personalized questions"
- ✅ Shows focusAreas array
- ✅ Shows personalizationLevel (0-100%)
- ✅ Questions focus on your weak areas

**If NOT Personalized:**
- ⚠️ Console shows: "using random real questions"
- ⚠️ No focusAreas shown
- ⚠️ This means: < 3 practice tests OR personalization disabled

---

## 🔍 **What to Look For:**

### **In Browser Console:**

**Personalized Exam:**
```javascript
Mock exam mock-exam1 using personalized questions: {
  total: 50,
  focusAreas: ["Priority Rules", "Hazard Perception", "Speed Limits"],
  personalizationLevel: 80,
  difficultyDistribution: { easy: 10, medium: 25, hard: 15 }
}
```

**Random Exam (Not Personalized):**
```javascript
Mock exam mock-exam1 using random real questions: {
  total: 50,
  realExamQuestions: 30,
  imageQuestions: 20
}
```

---

## 🎯 **Quick Test Steps:**

1. **Take 3+ practice tests** (if you haven't already)
   - Go to any practice test
   - Complete it
   - Repeat 2 more times

2. **Check personalization status:**
   - Open console
   - Run: `JSON.parse(localStorage.getItem('testHistory') || '[]').length`
   - Should be >= 3

3. **Start a mock exam:**
   - Go to Mock Exam selection
   - Select any exam
   - Start it
   - Check console for personalization logs

4. **Verify focus areas:**
   - Console should show your weak areas
   - Questions should be from those areas

---

## 🐛 **Troubleshooting:**

### **"using random real questions" instead of personalized:**

**Check:**
1. ✅ Do you have 3+ practice tests? 
   ```javascript
   JSON.parse(localStorage.getItem('testHistory') || '[]').length >= 3
   ```

2. ✅ Is personalization enabled?
   ```javascript
   localStorage.getItem('mockExamPersonalization') !== 'false'
   ```

3. ✅ Do you have test history?
   ```javascript
   JSON.parse(localStorage.getItem('testHistory') || '[]')
   ```

### **No focus areas shown:**

- This means no weak areas detected
- All your topics have score >= 60%
- Try taking practice tests and getting some wrong answers

---

## 📊 **Expected Behavior:**

### **With 3+ Practice Tests:**
- ✅ Exam is personalized
- ✅ Questions from weak areas
- ✅ Console shows focus areas
- ✅ Personalization level shown

### **With < 3 Practice Tests:**
- ⚠️ Exam is random (not personalized)
- ⚠️ No focus areas
- ⚠️ This is normal - need more test history

---

## 🎉 **Success Indicators:**

✅ Console log shows "using personalized questions"  
✅ Focus areas array is shown  
✅ Personalization level > 0%  
✅ Questions match your weak areas  

---

## 💡 **Quick Console Commands:**

```javascript
// Check test history
const history = JSON.parse(localStorage.getItem('testHistory') || '[]');
console.log('History:', history);
console.log('Count:', history.length);
console.log('Should personalize:', history.length >= 3);

// Check personalization setting
console.log('Personalization enabled:', localStorage.getItem('mockExamPersonalization'));

// Check weak topics
// (This requires accessing aiCoach service - check in app)
```

---

**Test it now and check the console!** 🚀


