# 🔍 How to Check Console for Dynamic Mock Exam

## 📋 **Step-by-Step Instructions:**

### **1. Open Safari Developer Tools**

**Method 1: Keyboard Shortcut**
- Press: `Cmd + Option + C`

**Method 2: Menu**
- Safari → Settings → Advanced
- Enable "Show Develop menu in menu bar"
- Then: Develop → Show JavaScript Console

### **2. Navigate to Mock Exam**

1. In the app, go to **Mock Exam** section
2. Select any mock exam
3. Click **"Start Exam"**

### **3. Check Console Logs**

Look for one of these messages:

#### **✅ If Personalized (Dynamic):**
```
Mock exam mock-exam1 using personalized questions: {
  total: 50,
  focusAreas: ["Priority Rules", "Hazard Perception"],
  personalizationLevel: 75,
  difficultyDistribution: { easy: 10, medium: 25, hard: 15 }
}
```

#### **⚠️ If NOT Personalized (Random):**
```
Mock exam mock-exam1 using random real questions: {
  total: 50,
  realExamQuestions: 30,
  imageQuestions: 20
}
```

---

## 🧪 **Quick Console Commands:**

### **Check Test History:**
```javascript
const history = JSON.parse(localStorage.getItem('testHistory') || '[]');
console.log('Test history:', history);
console.log('Count:', history.length);
console.log('Can personalize:', history.length >= 3);
```

### **Check Personalization Setting:**
```javascript
console.log('Personalization enabled:', localStorage.getItem('mockExamPersonalization'));
```

### **Check All LocalStorage:**
```javascript
console.log('All localStorage:', { ...localStorage });
```

---

## 🎯 **What Each Log Means:**

### **"using personalized questions"**
- ✅ Dynamic mock exam is working!
- ✅ Questions are from your weak areas
- ✅ Shows focus areas and personalization level

### **"using random real questions"**
- ⚠️ Not personalized (normal if < 3 practice tests)
- ⚠️ Still uses real CBR questions, just random selection
- ⚠️ Need 3+ practice tests for personalization

---

## 🐛 **If You Don't See Any Logs:**

1. **Clear console** - Click the clear button (🚫)
2. **Refresh the page** - `Cmd + R`
3. **Start exam again** - The log appears when exam loads
4. **Check filter** - Make sure "All" or "Logs" is selected

---

## 📊 **Expected Console Output:**

When you start a mock exam, you should see:

```
Mock exam mock-exam1 using personalized questions: {
  total: 50,
  focusAreas: Array(3) ["Priority Rules", "Hazard Perception", "Speed Limits"],
  personalizationLevel: 80,
  difficultyDistribution: { easy: 10, medium: 25, hard: 15 }
}
```

Or if not personalized:

```
Mock exam mock-exam1 using random real questions: {
  total: 50,
  realExamQuestions: 30,
  imageQuestions: 20
}
```

---

**Open the console now and start a mock exam to see the logs!** 🚀


