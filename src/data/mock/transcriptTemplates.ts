import type { CategoryId, Language, ObjectionCategory } from "@/types";

/**
 * Mock dialogue used to build transcripts. Tagged salesperson turns have a "good" and a "weak"
 * variant so that the transcript reflects the generated category score.
 * Placeholders: {sp} salesperson, {prospect} prospect.
 */
export interface TemplateTurn {
  who: "sp" | "pr";
  cat?: CategoryId;
  good: string;
  weak: string;
  slot?: "objection";
}

const sp = (cat: CategoryId, good: string, weak: string): TemplateTurn => ({ who: "sp", cat, good, weak });
const plain = (who: "sp" | "pr", text: string): TemplateTurn => ({ who, good: text, weak: text });
const slot: TemplateTurn = { who: "pr", good: "", weak: "", slot: "objection" };

const english: TemplateTurn[] = [
  sp("intro", "Hello, is this {prospect}? Hi, I'm {sp} from FlexiFunnels. You enquired about our programme — do you have ten minutes? I'd like to understand your goals first and then show you what fits.", "Hello {prospect}, {sp} from FlexiFunnels, you filled a form. Let me tell you about our programme."),
  plain("pr", "Yes, I have a few minutes. Go ahead."),
  sp("intent", "What made you reach out now, and what have you already tried so far?", "So you're interested in funnels, right? Let me explain how they work."),
  plain("pr", "I tried a couple of YouTube courses, but I never got a working funnel live."),
  sp("persona", "Tell me about your background — what do you do today, and who do you want to sell to?", "Okay. Are you a beginner or experienced?"),
  plain("pr", "I run a small coaching practice, mostly for college students."),
  sp("goals", "What's your goal for the next six months — how much monthly income, and by when?", "So you want to grow your business, good."),
  plain("pr", "I'd like to reach about one lakh a month by April."),
  sp("motivation", "What would hitting that number change for you personally, and what happens if you wait another year?", "That's a good target. Many of our members hit it."),
  plain("pr", "I want to leave my day job. Honestly, I'm tired of waiting."),
  sp("challenges", "What has stopped you so far — is it tools, traffic, or not knowing what to build first?", "I think the challenge is just technology, right?"),
  plain("pr", "Mostly I don't know what to build first, and ads confuse me."),
  sp("solution", "Since you said you don't know what to build first, our guided funnel templates and weekly reviews map exactly to that.", "Our programme has templates, ads training, community and many more features."),
  sp("testimonials", "A coach like you built her first funnel in three weeks — I can share her walkthrough. And yes, the plan includes ad training modules.", "We have many success stories. I'm not sure about the exact module list."),
  slot,
  sp("objection", "I understand, and thanks for telling me. Can you share a little more about what's behind that concern? Once I know, I can suggest a relevant option.", "That's not really an issue. Everyone says that. Let's move ahead."),
  plain("pr", "That makes sense. Tell me what the options are."),
  sp("ethics", "I can't promise an income — results depend on your effort — but I want to be sure this programme actually suits your stage before you decide.", "You will definitely earn within two months, most people do."),
  sp("communication", "Let me make sure I have this right: you run a coaching practice, you're aiming for one lakh a month by April, and your main gap is knowing what to build first.", "Yeah yeah, got it. Anyway, as I was saying about the features —"),
  sp("closing", "Shall we start with the starter plan today? I'll send the payment link and book our onboarding call tomorrow at 11 AM.", "Okay, think about it and let us know."),
  plain("pr", "Okay, send me the details. Tomorrow at 11 works."),
  plain("sp", "Great, talk to you tomorrow. Thank you, {prospect}."),
];

const hinglish: TemplateTurn[] = [
  sp("intro", "Hello, kya meri baat {prospect} ji se ho rahi hai? Main {sp}, FlexiFunnels se. Aapne enquiry ki thi — kya aapke paas 10 minute hain? Pehle main aapke goals samajhna chahta hoon, phir batata hoon kya fit hoga.", "Hello {prospect} ji, {sp} FlexiFunnels se. Aapne form bhara tha, main program ke baare mein bata deta hoon."),
  plain("pr", "Haan boliye, 10 minute hain."),
  sp("intent", "Aapne abhi enquiry kyun ki, aur ab tak kya kya try kar chuke hain?", "Toh aapko funnels chahiye, right? Main bata deta hoon kaise kaam karte hain."),
  plain("pr", "Maine YouTube se kuch seekha, par ek bhi funnel properly live nahi ho paya."),
  sp("persona", "Apne background ke baare mein bataiye — abhi aap kya karte hain aur aapke customers kaun hain?", "Okay. Aap beginner hain ya experienced?"),
  plain("pr", "Main ek chhota coaching business chalata hoon, mostly college students ke liye."),
  sp("goals", "Agle 6 mahine ka goal kya hai — monthly kitni income, aur kab tak?", "Achha, toh aap business grow karna chahte hain."),
  plain("pr", "Mujhe April tak mahine ke ek lakh tak pahunchna hai."),
  sp("motivation", "Ye number hit karne se aapki life mein kya badlega, aur agar ek saal aur ruke toh kya hoga?", "Bahut accha target hai, kaafi log yeh achieve karte hain."),
  plain("pr", "Mujhe job chhodni hai. Ab aur wait nahi karna."),
  sp("challenges", "Ab tak rukawat kahan thi — tools, traffic, ya ye nahi pata tha ki pehle kya banana hai?", "Mujhe lagta hai problem sirf technology ki hai, hai na?"),
  plain("pr", "Sabse badi dikkat ye hai ki pehle kya banana hai, aur ads samajh nahi aate."),
  sp("solution", "Aapne kaha ki pehle kya banana hai ye clear nahi hai — humare guided templates aur weekly reviews exactly isi ke liye hain.", "Humare program mein templates, ads training, community aur bahut kuch hai."),
  sp("testimonials", "Aapke jaise ek coach ne 3 hafte mein pehla funnel live kiya — main uska walkthrough share karta hoon. Ads ke modules bhi plan mein hain.", "Humare paas bahut success stories hain. Modules ki exact list mujhe abhi yaad nahi."),
  slot,
  sp("objection", "Samajh sakta hoon, aur bataane ke liye thanks. Is concern ke peeche exact kya hai, thoda bata sakte hain? Phir main sahi option suggest karunga.", "Ye koi issue nahi hai. Sab yahi kehte hain. Chaliye aage badhte hain."),
  plain("pr", "Theek hai, options bataiye."),
  sp("ethics", "Income ki guarantee main nahi de sakta — result aapki mehnat par depend karta hai — par pehle ye check karna chahta hoon ki program aapke stage ke liye sahi hai ya nahi.", "Aap 2 mahine mein definitely kamaoge, zyaadatar log kamate hain."),
  sp("communication", "Main confirm kar loon: aap coaching chalate hain, April tak ek lakh ka goal hai, aur main gap ye hai ki pehle kya banana hai.", "Haan haan samajh gaya. Waise features ke baare mein main keh raha tha —"),
  sp("closing", "Toh kya hum aaj starter plan se shuru karein? Main payment link bhejta hoon aur kal subah 11 baje onboarding call book kar deta hoon.", "Theek hai, aap soch lijiye aur bata dijiye."),
  plain("pr", "Theek hai, details bhej dijiye. Kal 11 baje chalega."),
  plain("sp", "Perfect, kal baat karte hain. Thank you {prospect} ji."),
];

const hindi: TemplateTurn[] = [
  sp("intro", "नमस्ते, क्या मेरी बात {prospect} जी से हो रही है? मैं {sp}, FlexiFunnels से। आपने जानकारी माँगी थी — क्या आपके पास 10 मिनट हैं? पहले मैं आपके लक्ष्य समझना चाहता हूँ, फिर बताऊँगा कि क्या सही रहेगा।", "नमस्ते {prospect} जी, मैं {sp}, FlexiFunnels से। आपने फ़ॉर्म भरा था, मैं प्रोग्राम के बारे में बता देता हूँ।"),
  plain("pr", "जी हाँ, बोलिए, 10 मिनट हैं।"),
  sp("intent", "आपने अभी जानकारी क्यों माँगी, और अब तक आपने क्या-क्या आज़माया है?", "तो आपको फ़नल चाहिए, ठीक है? मैं बताता हूँ कि ये कैसे काम करते हैं।"),
  plain("pr", "मैंने यूट्यूब से कुछ सीखा, पर एक भी फ़नल ठीक से लाइव नहीं हो पाया।"),
  sp("persona", "अपने बारे में बताइए — अभी आप क्या करते हैं और आपके ग्राहक कौन हैं?", "ठीक है। आप शुरुआती हैं या अनुभवी?"),
  plain("pr", "मैं एक छोटा कोचिंग बिज़नेस चलाता हूँ, ज़्यादातर कॉलेज के छात्रों के लिए।"),
  sp("goals", "अगले छह महीनों का लक्ष्य क्या है — महीने की कितनी आमदनी, और कब तक?", "अच्छा, तो आप बिज़नेस बढ़ाना चाहते हैं।"),
  plain("pr", "अप्रैल तक महीने में एक लाख तक पहुँचना है।"),
  sp("motivation", "ये लक्ष्य पाने से आपकी ज़िंदगी में क्या बदलेगा, और अगर एक साल और रुके तो क्या होगा?", "बहुत अच्छा लक्ष्य है, बहुत लोग इसे हासिल करते हैं।"),
  plain("pr", "मुझे नौकरी छोड़नी है। अब और इंतज़ार नहीं करना।"),
  sp("challenges", "अब तक रुकावट कहाँ थी — टूल्स, ट्रैफ़िक, या ये पता नहीं था कि पहले क्या बनाएँ?", "मुझे लगता है समस्या सिर्फ़ तकनीक की है, है न?"),
  plain("pr", "सबसे बड़ी दिक्कत यही है कि पहले क्या बनाऊँ, और विज्ञापन समझ नहीं आते।"),
  sp("solution", "आपने कहा कि पहले क्या बनाना है ये साफ़ नहीं — हमारे गाइडेड टेम्पलेट और साप्ताहिक रिव्यू ठीक इसी के लिए हैं।", "हमारे प्रोग्राम में टेम्पलेट, विज्ञापन ट्रेनिंग, कम्युनिटी और बहुत कुछ है।"),
  sp("testimonials", "आप जैसे एक कोच ने तीन हफ़्ते में पहला फ़नल लाइव किया — मैं उसका वॉकथ्रू भेजता हूँ। विज्ञापन के मॉड्यूल भी प्लान में हैं।", "हमारे पास बहुत सफलता की कहानियाँ हैं। मॉड्यूल की सटीक सूची मुझे अभी याद नहीं।"),
  slot,
  sp("objection", "मैं समझ सकता हूँ, बताने के लिए धन्यवाद। इस चिंता के पीछे ठीक-ठीक क्या है, थोड़ा बताएँगे? फिर मैं सही विकल्प सुझाऊँगा।", "ये कोई समस्या नहीं है। सब यही कहते हैं। चलिए आगे बढ़ते हैं।"),
  plain("pr", "ठीक है, विकल्प बताइए।"),
  sp("ethics", "आमदनी की गारंटी मैं नहीं दे सकता — नतीजे आपकी मेहनत पर निर्भर हैं — पर पहले ये देखना चाहता हूँ कि प्रोग्राम आपके स्तर के लिए सही है या नहीं।", "आप दो महीने में पक्का कमाएँगे, ज़्यादातर लोग कमाते हैं।"),
  sp("communication", "मैं दोहरा दूँ: आप कोचिंग चलाते हैं, अप्रैल तक एक लाख का लक्ष्य है, और मुख्य कमी ये है कि पहले क्या बनाना है।", "हाँ हाँ समझ गया। वैसे फ़ीचर्स के बारे में मैं कह रहा था —"),
  sp("closing", "तो क्या हम आज स्टार्टर प्लान से शुरू करें? मैं पेमेंट लिंक भेजता हूँ और कल सुबह 11 बजे ऑनबोर्डिंग कॉल बुक कर देता हूँ।", "ठीक है, आप सोच लीजिए और बता दीजिए।"),
  plain("pr", "ठीक है, डिटेल्स भेज दीजिए। कल 11 बजे चलेगा।"),
  plain("sp", "बढ़िया, कल बात करते हैं। धन्यवाद {prospect} जी।"),
];

export const TEMPLATES: Record<Language, TemplateTurn[]> = { english, hinglish, hindi };

export const OBJECTION_LINES: Record<Language, Record<ObjectionCategory, string>> = {
  english: {
    financial: "Honestly, the price is above my budget right now.",
    time: "I'm not sure I'll find the time to follow a programme with my schedule.",
    suitability: "I'm not sure this is right for my kind of business.",
    trust: "I've been burnt by online programmes before. How do I know this is genuine?",
    decision_maker: "My business partner decides on spending — he isn't here right now.",
    consult: "I'd like to talk to my family before I decide anything.",
    other: "I need to think about it and compare a few more options.",
  },
  hinglish: {
    financial: "Sach bataun toh price abhi mere budget se zyada hai.",
    time: "Mere schedule mein itna time nikalna mushkil lagta hai.",
    suitability: "Mujhe nahi lagta ye mere type ke business ke liye sahi hai.",
    trust: "Pehle online programs mein dhokha khaya hai. Kaise pata ye genuine hai?",
    decision_maker: "Spending ka decision mere partner lete hain, wo abhi yahan nahi hain.",
    consult: "Main decide karne se pehle family se baat karna chahunga.",
    other: "Mujhe thoda sochna hai aur kuch aur options compare karne hain.",
  },
  hindi: {
    financial: "सच कहूँ तो कीमत अभी मेरे बजट से ज़्यादा है।",
    time: "मेरे शेड्यूल में इतना समय निकालना मुश्किल लगता है।",
    suitability: "मुझे नहीं लगता ये मेरे तरह के बिज़नेस के लिए सही है।",
    trust: "पहले ऑनलाइन प्रोग्राम्स में धोखा खाया है। कैसे पता कि ये असली है?",
    decision_maker: "खर्च का फ़ैसला मेरे पार्टनर लेते हैं, वो अभी यहाँ नहीं हैं।",
    consult: "फ़ैसला लेने से पहले मैं परिवार से बात करना चाहूँगा।",
    other: "मुझे थोड़ा सोचना है और कुछ और विकल्प देखने हैं।",
  },
};
