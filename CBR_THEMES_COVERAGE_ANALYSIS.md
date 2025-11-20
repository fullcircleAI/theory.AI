# CBR Themes Coverage Analysis

## 📊 **CURRENT SITUATION**

### **Subjects in Database:**
The real exam questions database contains **15 subjects** with **38 regular questions**:

1. **Speed Limits** - 6 questions
2. **Warning Signs** - 5 questions
3. **Prohibitory Signs** - 5 questions
4. **Traffic Lights** - 4 questions
5. **Traffic Signs** - 3 questions
6. **Safety Rules** - 2 questions
7. **Weather Conditions** - 2 questions
8. **Overtaking** - 2 questions
9. **Pedestrian Crossings** - 2 questions
10. **Construction Zones** - 2 questions
11. **Hazard Perception** - 1 question ⚠️
12. **Priority Rules** - 1 question ⚠️
13. **Roundabout Rules** - 1 question ⚠️
14. **Lane Changing** - 1 question ⚠️
15. **Road Markings** - 1 question ⚠️

**Plus:** Image questions in `mockExamImageQuestions` (covers additional themes)

---

## ⚠️ **ISSUE IDENTIFIED**

### **Problem:**
The mock exam generation **CAN include all themes**, but **doesn't guarantee** they will all appear in a single exam because:

1. **Weak Area Prioritization:** 50-70% of questions come from weak areas (only 3 topics max)
2. **Random Selection:** Remaining questions are randomly selected from medium/strong areas
3. **Limited Questions:** Only 38 regular questions cover 15 subjects (some subjects have only 1-2 questions)
4. **No Diversity Guarantee:** No logic ensures all major CBR themes are represented

### **Result:**
- A mock exam might focus heavily on 3-5 subjects
- Some important CBR themes (like Hazard Perception, Priority Rules) might be completely missing
- Not representative of the real CBR exam structure

---

## ✅ **SOLUTION NEEDED**

### **Recommendation:**
Add **theme diversity logic** to ensure all major CBR themes are represented in each mock exam:

1. **Minimum Representation:** Ensure each major theme appears at least once
2. **Balanced Distribution:** Distribute questions across all themes (not just weak areas)
3. **Priority System:** 
   - Weak areas get 50-70% (as current)
   - Remaining 30-50% distributed across ALL other themes
   - Ensure no theme is completely missing

### **Implementation:**
- Add a "theme coverage" check before finalizing exam
- If a major theme is missing, replace a question to include it
- Maintain CBR structure (30 regular + 20 image) while ensuring diversity

---

## 📋 **OFFICIAL CBR THEMES (Expected)**

Based on CBR exam structure, these themes should be covered:

1. ✅ **Hazard Perception** (Gevaarherkenning)
2. ✅ **Priority Rules** (Voorrangsregels)
3. ✅ **Road Signs** (Verkeersborden) - Warning, Prohibitory, Mandatory
4. ✅ **Traffic Lights** (Verkeerslichten)
5. ✅ **Speed Limits** (Snelheidslimieten)
6. ✅ **Roundabout Rules** (Rotondes)
7. ✅ **Motorway Rules** (Autosnelweg)
8. ✅ **Overtaking** (Inhalen)
9. ✅ **Pedestrian Crossings** (Voetgangersoversteekplaatsen)
10. ✅ **Bicycle Interactions** (Fietsers)
11. ✅ **Tram Interactions** (Trams)
12. ✅ **Parking Rules** (Parkeren)
13. ✅ **Weather Conditions** (Weersomstandigheden)
14. ✅ **Construction Zones** (Werk in uitvoering)
15. ✅ **Vehicle Knowledge** (Voertuigkennis)
16. ✅ **Environmental Zones** (Milieuzones)
17. ✅ **Technology & Safety** (Technologie & Veiligheid)
18. ✅ **Alcohol & Drugs** (Alcohol & Drugs)
19. ✅ **Fatigue & Rest** (Vermoeidheid & Rust)
20. ✅ **Emergency Procedures** (Noodprocedures)

---

## 🎯 **CURRENT STATUS**

| Status | Description |
|--------|-------------|
| ✅ **Database Coverage** | 15 subjects in database (some with very few questions) |
| ⚠️ **Selection Logic** | Pulls from ALL questions, but prioritizes weak areas |
| ❌ **Diversity Guarantee** | **NO** - Not all themes guaranteed in each exam |
| ❌ **Minimum Representation** | **NO** - Some themes might be completely missing |

---

## 🔧 **NEXT STEPS**

1. **Add theme diversity logic** to ensure all major themes are represented
2. **Expand question database** to have more questions per theme (especially themes with only 1-2 questions)
3. **Implement balanced distribution** that maintains weak area focus while ensuring theme coverage

