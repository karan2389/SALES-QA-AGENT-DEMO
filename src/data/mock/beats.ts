import type { FlagId, Language, ObjectionType } from "@/types";

/** Mock dialogue. {sp} = salesperson first name, {p} = prospect first name. Placeholder content, not real calls. */
export interface Beat { cat: string; who: "sp" | "pr"; en: string; hi: string }
const sp = (cat: string, en: string, hi: string): Beat => ({ cat, who: "sp", en, hi });
const pr = (cat: string, en: string, hi: string): Beat => ({ cat, who: "pr", en, hi });

export const BEATS: Beat[] = [
  sp("C01", "Hello, is this {p}? Hi, I'm {sp} from FlexiFunnels. You attended our webinar — do you have ten minutes so I can understand your goals?", "नमस्ते, क्या मेरी बात {p} जी से हो रही है? मैं {sp}, FlexiFunnels से। आपने हमारा वेबिनार देखा था — क्या आपके पास 10 मिनट हैं ताकि मैं आपके लक्ष्य समझ सकूँ?"),
  pr("C01", "Yes, I have a few minutes. Go ahead.", "जी हाँ, बोलिए, 10 मिनट हैं।"),
  sp("C02", "What made you attend the webinar, and what are you hoping to achieve from it?", "आपने वेबिनार क्यों देखा, और इससे आप क्या हासिल करना चाहते हैं?"),
  pr("C02", "I want to start an online business, but I never got anything live.", "मैं ऑनलाइन बिज़नेस शुरू करना चाहता हूँ, पर आज तक कुछ लाइव नहीं कर पाया।"),
  sp("C03", "Tell me about your background — what do you do today and who do you want to sell to?", "अपने बारे में बताइए — अभी आप क्या करते हैं और आपके ग्राहक कौन होंगे?"),
  pr("C03", "I run a small coaching practice, mostly for college students.", "मैं एक छोटा कोचिंग बिज़नेस चलाता हूँ, ज़्यादातर कॉलेज के छात्रों के लिए।"),
  sp("C04", "What does your online plan look like — what will you sell and how will people find you?", "आपकी ऑनलाइन योजना क्या है — आप क्या बेचेंगे और लोग आप तक कैसे पहुँचेंगे?"),
  pr("C04", "Mostly online classes. I'll use Instagram and WhatsApp groups.", "ज़्यादातर ऑनलाइन क्लासेस। इंस्टाग्राम और व्हाट्सऐप ग्रुप से।"),
  sp("C05", "What monthly income are you aiming for, and by when?", "महीने की कितनी आमदनी का लक्ष्य है, और कब तक?"),
  pr("C05", "About one lakh a month by April.", "अप्रैल तक महीने में एक लाख।"),
  sp("C06", "What would reaching that number change for you and your family?", "ये लक्ष्य पाने से आपके और आपके परिवार की ज़िंदगी में क्या बदलेगा?"),
  pr("C06", "I want to leave my day job. Honestly, I'm tired of waiting.", "मुझे नौकरी छोड़नी है। अब और इंतज़ार नहीं करना।"),
  sp("C07", "What makes now the right time, and what happens if you wait another year?", "अभी का समय सही क्यों है, और अगर एक साल और रुके तो क्या होगा?"),
  sp("C08", "Let me go through your plan with you — Instagram and groups is a good start, but where will bookings and payments come from?", "चलिए आपकी योजना देखते हैं — इंस्टाग्राम और ग्रुप अच्छी शुरुआत है, पर बुकिंग और पेमेंट कहाँ से आएँगे?"),
  pr("C08", "I hadn't thought about bookings or payments.", "बुकिंग और पेमेंट के बारे में मैंने सोचा नहीं था।"),
  sp("C09", "What has been the biggest challenge so far?", "अब तक सबसे बड़ी चुनौती क्या रही?"),
  pr("C09", "Mostly I don't know what to build first, and ads confuse me.", "सबसे बड़ी दिक्कत यही है कि पहले क्या बनाऊँ, और विज्ञापन समझ नहीं आते।"),
  sp("C10", "How comfortable are you with funnels, tools and ads — where do you feel least confident?", "फ़नल, टूल्स और विज्ञापन में आप कितने सहज हैं — किस जगह सबसे कम भरोसा है?"),
  pr("C10", "Tools are fine, but ads and funnels are new to me.", "टूल्स ठीक हैं, पर विज्ञापन और फ़नल मेरे लिए नए हैं।"),
  sp("C11", "Since you said you don't know what to build first, our guided templates and weekly reviews map to exactly that. Support is available on chat during working hours.", "आपने कहा कि पहले क्या बनाना है ये साफ़ नहीं — हमारे गाइडेड टेम्पलेट और साप्ताहिक रिव्यू ठीक इसी के लिए हैं। सपोर्ट कार्य-समय में चैट पर उपलब्ध है।"),
  sp("C12", "Have you tried any course or tool before, and what didn't work?", "क्या आपने पहले कोई कोर्स या टूल आज़माया है, और क्या काम नहीं आया?"),
  pr("C12", "I bought a course earlier but it had no support.", "पहले एक कोर्स लिया था पर उसमें कोई सपोर्ट नहीं था।"),
  sp("C13", "If things stay the same for another year, where do you see your income and your day job?", "अगर एक साल तक सब ऐसा ही रहा तो आपकी आमदनी और नौकरी कहाँ होगी?"),
  sp("C14", "A coach like you built her first funnel in three weeks — I can share her walkthrough.", "आप जैसे एक कोच ने तीन हफ़्ते में पहला फ़नल लाइव किया — मैं उसका वॉकथ्रू भेजता हूँ।"),
  sp("C15", "What's different here is the done-with-you templates, a community of coaches and a support team — and I can walk you through the pricing.", "यहाँ फ़र्क ये है कि टेम्पलेट साथ बनते हैं, कोचों की कम्युनिटी है और सपोर्ट टीम है — और मैं आपको प्राइसिंग भी समझा देता हूँ।"),
  sp("C16", "So you want a guided start, templates, and someone to review your first funnel — does that sound right?", "तो आपको गाइडेड शुरुआत, टेम्पलेट और पहले फ़नल का रिव्यू चाहिए — सही समझा?"),
  pr("C16", "Yes, that's exactly what I need.", "जी, यही चाहिए।"),
  sp("C17", "Shall we start with the starter plan today? I'll send the payment link and book our onboarding call tomorrow at 11 AM.", "क्या हम आज स्टार्टर प्लान से शुरू करें? मैं पेमेंट लिंक भेजता हूँ और कल सुबह 11 बजे ऑनबोर्डिंग कॉल बुक कर देता हूँ।"),
  // The prospect's objection line is inserted here by the generator (type-specific).
  sp("C18", "I understand, and thanks for telling me. Can you share a bit more about what's behind that concern? Then I can suggest a relevant option.", "मैं समझ सकता हूँ, बताने के लिए धन्यवाद। इस चिंता के पीछे ठीक-ठीक क्या है, थोड़ा बताएँगे? फिर मैं सही विकल्प सुझाऊँगा।"),
  pr("C18", "That makes sense. Tell me about the options.", "ठीक है, विकल्प बताइए।"),
  sp("C19", "That's a fair concern and it shows you're taking this seriously — let's tie the options back to your one-lakh goal.", "ये जायज़ चिंता है और दिखाती है कि आप इसे गंभीरता से ले रहे हैं — चलिए विकल्पों को आपके एक लाख के लक्ष्य से जोड़ते हैं।"),
  pr("C19", "Okay, send me the details. Tomorrow at 11 works.", "ठीक है, डिटेल्स भेज दीजिए। कल 11 बजे चलेगा।"),
];

export const OBJECTION_LINES: Record<Language, Record<ObjectionType, string>> = {
  english: {
    financial: "Honestly, the price is above my budget right now.",
    time: "I'm not sure I'll find the time to follow a programme with my schedule.",
    suitability: "I'm not sure this is right for my kind of business.",
    trust: "I've been burnt by online programmes before. How do I know this is genuine?",
    decision_maker: "My business partner decides on spending — he isn't here right now.",
    consult: "I'd like to talk to my family before I decide anything.",
    other: "I need to think about it and compare a few more options.",
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

/** Lines a salesperson says when a critical flag is raised (inserted into the transcript after C15). */
export const FLAG_LINES: Record<FlagId, { en: string; hi: string }> = {
  misleading_product_claim: { en: "Our system will automatically get you customers — you don't need to do any marketing.", hi: "हमारा सिस्टम अपने आप ग्राहक ला देगा — आपको कोई मार्केटिंग नहीं करनी पड़ेगी।" },
  false_earnings_promise: { en: "If you follow the plan you will definitely earn two lakh within two months — everyone does.", hi: "अगर आप प्लान फ़ॉलो करेंगे तो दो महीने में पक्का दो लाख कमाएँगे — सब कमाते हैं।" },
  fake_urgency: { en: "This price is only valid till tonight — after that it goes up by forty percent.", hi: "ये कीमत सिर्फ़ आज रात तक है — उसके बाद चालीस प्रतिशत बढ़ जाएगी।" },
  financial_pressure: { en: "Just put it on a credit card or borrow from family — you can't miss this.", hi: "क्रेडिट कार्ड पर डाल दीजिए या परिवार से उधार ले लीजिए — ये मौका मत छोड़िए।" },
  refusal_not_respected: { en: "I know you said no, but let's just do the payment now and think later.", hi: "मुझे पता है आपने मना किया, पर अभी पेमेंट कर दीजिए, सोचना बाद में।" },
  misrepresented_support: { en: "We have a dedicated manager on call for you twenty-four seven.", hi: "आपके लिए चौबीसों घंटे एक डेडिकेटेड मैनेजर कॉल पर रहेगा।" },
  fabricated_social_proof: { en: "Last month a student of ours made ten lakh in just two weeks.", hi: "पिछले महीने हमारे एक छात्र ने सिर्फ़ दो हफ़्ते में दस लाख कमाए।" },
  coercive_emotional_pressure: { en: "If you don't act now, you'll regret it your whole life — think of your family.", hi: "अभी नहीं किया तो ज़िंदगी भर पछताएँगे — अपने परिवार के बारे में सोचिए।" },
  unsupported_customer_fit: { en: "This is perfect for you — it works for every kind of business.", hi: "ये आपके लिए बिल्कुल सही है — ये हर तरह के बिज़नेस के लिए काम करता है।" },
  unprofessional_conduct: { en: "Look, I already explained this twice — were you not listening?", hi: "देखिए, मैंने ये दो बार समझाया — आप सुन नहीं रहे थे क्या?" },
};

/** Characters used to simulate a corrupted transcript. */
export const CORRUPT_TEXT = "�� ��� ?? �� ���� ?? �� ��� � ��";
