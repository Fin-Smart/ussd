/**
 * Pre-written lessons and quizzes that replace Smart Coach's AI-written ones. In each question the
 * first option is the correct one; options are shuffled when a quiz starts. Questions and options
 * are kept short so a whole question fits on one 182-character USSD screen.
 */
export const LESSONS = [
  {
    id: 'budgeting',
    title: 'Budgeting basics',
    lesson: [
      'A budget is a plan for your money. You decide in advance where each rand goes, so you control your money instead of wondering where it went.',
      'Start with what comes in each month. Then list what goes out: rent, food, transport, airtime. Give each a limit. In FinSmart these limits are categories.',
      'Example: you earn R10 000. Rent R4 000, food R2 500, transport R1 200, savings R1 000 and R1 300 for the rest. Track spending and adjust each month.',
    ],
    quiz: [
      { q: 'What is a budget?', options: ['A plan for your money', 'A type of bank loan', 'A savings account', 'A tax form'], why: 'A budget is simply a plan for where your money goes.' },
      { q: 'What should you list first when budgeting?', options: ['Money coming in', 'Things to buy', 'Your wish list', "Last year's tax"], why: 'Start with your income so you know how much you can plan with.' },
      { q: 'You earn R8 000 and plan to spend R8 500. The problem?', options: ['You plan too much', 'Nothing at all', 'You save too much', 'Rent is too low'], why: 'Your plan should never be more than your income.' },
      { q: 'How often should you review a monthly budget?', options: ['Every month', 'Once a year', 'Only when broke', 'Never'], why: 'Life changes, so check and adjust your budget every month.' },
      { q: 'Why track what you spend?', options: ['To stick to the plan', 'Banks require it', 'To pay less tax', 'It raises your pay'], why: 'Tracking shows where money really goes and where to adjust.' },
    ],
  },
  {
    id: 'needs-wants',
    title: 'Needs vs wants',
    lesson: [
      'Needs are things you must have to live and work: housing, basic food, transport to work, electricity. Wants are nice to have: takeaways, new clothes, streaming.',
      'When money is tight, pay needs first. Then save something, even a little. Spend on wants with what is left.',
      'A popular guide is 50/30/20: about 50% on needs, 30% on wants and 20% on savings and paying off debt. Adjust it to fit your life.',
    ],
    quiz: [
      { q: 'Which of these is a need?', options: ['Rent', 'Takeaway pizza', 'Concert tickets', 'A new phone case'], why: 'A place to live is a need. The others are nice to have.' },
      { q: 'Which of these is a want?', options: ['Streaming', 'Electricity', 'Taxi to work', 'Basic groceries'], why: 'Streaming is fun, but you can live without it.' },
      { q: 'In the 50/30/20 guide, what is the 20% for?', options: ['Savings and debt', 'Wants', 'Rent', 'Entertainment'], why: '20% goes to your future: saving and paying off debt.' },
      { q: 'Money is tight this month. What do you pay first?', options: ['Your needs', 'Your wants', 'Online shopping', 'Gifts for friends'], why: 'Cover the essentials first, then decide on the extras.' },
      { q: 'A R50 coffee every day costs about how much a month?', options: ['R1 500', 'R150', 'R500', 'R5 000'], why: 'R50 x 30 days is about R1 500. Small wants add up.' },
    ],
  },
  {
    id: 'emergency',
    title: 'Emergency fund',
    lesson: [
      'An emergency fund is money kept aside only for surprises: losing your job, a medical bill, or fixing your car.',
      'Without one, a surprise often means borrowing at high interest. With one, you pay the bill and move on.',
      'Aim for 3 to 6 months of essential costs. Start small: R200 a month adds up to R2 400 in a year. Keep it in a separate savings account you can reach quickly.',
    ],
    quiz: [
      { q: 'What is an emergency fund for?', options: ['Unexpected costs', 'Holidays', 'New clothes', 'Buying shares'], why: "It's a safety net for surprises, not planned spending." },
      { q: 'How much should it cover, ideally?', options: ['3 to 6 months of costs', 'One week of costs', "A year's salary", 'Just R100'], why: '3 to 6 months of essentials gives you time to recover.' },
      { q: 'Saving R200 a month gives you how much in a year?', options: ['R2 400', 'R1 200', 'R200', 'R24 000'], why: 'R200 x 12 months is R2 400. Small amounts grow.' },
      { q: 'Where is a good place to keep it?', options: ['A savings account', 'In your wallet', 'In shares', 'Lent to a friend'], why: 'A separate savings account keeps it safe but reachable.' },
      { q: 'Your car breaks down and you have no fund. You may...', options: ['Borrow at high cost', 'Earn interest', 'Pay less tax', 'Get a bonus'], why: 'Without savings, surprises often turn into expensive debt.' },
    ],
  },
  {
    id: 'saving-investing',
    title: 'Saving vs investing',
    lesson: [
      'Saving means keeping money safe for short-term goals and emergencies, usually in a bank account. It grows slowly, but you can reach it quickly.',
      'Investing means buying things like shares or funds that can grow faster over many years. The value goes up and down, so you could lose money in the short term.',
      'Rule of thumb: save for goals under 3 years away and for emergencies. Consider investing for goals 5 or more years away, like retirement.',
    ],
    quiz: [
      { q: 'Which is usually lower risk?', options: ['Saving', 'Investing in shares', 'Both the same', 'Crypto trading'], why: 'Savings accounts are steady; investments go up and down.' },
      { q: 'Best for money you need next month?', options: ['Saving', 'Investing', 'Lottery tickets', 'Long-term shares'], why: 'Money you need soon should be safe and easy to reach.' },
      { q: 'Investing is usually better for...', options: ['Goals 5+ years away', "Next week's rent", 'Emergencies', 'Paying bills'], why: 'Time helps investments recover from ups and downs.' },
      { q: 'Can investments lose value?', options: ['Yes, for a while', 'No, never', 'Only in banks', 'Only on weekends'], why: 'Values rise and fall. That is the risk of investing.' },
      { q: 'Someone promises guaranteed high returns. This is...', options: ['A warning sign', 'A great deal', 'Normal investing', 'A bank rule'], why: 'Real investments never guarantee returns.' },
    ],
  },
  {
    id: 'interest',
    title: 'Compound interest',
    lesson: [
      'Interest is the price of money. When you save, the bank pays you interest. When you borrow, you pay interest.',
      'Compound interest means you earn interest on your interest. R1 000 at 10% a year becomes R1 100, then R1 210, then R1 331. It speeds up over time.',
      'It works against you with debt too: unpaid credit card interest also compounds. Start saving early and pay off debt fast.',
    ],
    quiz: [
      { q: 'R1 000 earns 10% for one year. You now have...', options: ['R1 100', 'R1 010', 'R2 000', 'R1 000'], why: '10% of R1 000 is R100, so you have R1 100.' },
      { q: 'Compound interest means earning interest on...', options: ['Your interest too', 'Only your deposit', "Others' money", 'Your salary'], why: 'Each year you also earn interest on past interest.' },
      { q: 'Who benefits most from compounding?', options: ['Those who start early', 'Those who start late', 'Only banks', 'No one'], why: 'More years means more time for interest to build.' },
      { q: 'Compound interest on debt makes the debt...', options: ['Grow faster', 'Disappear', 'Stay the same', 'Tax free'], why: 'Unpaid interest gets added, so debt grows quickly.' },
      { q: 'R1 000 at 10% a year for two years becomes...', options: ['R1 210', 'R1 200', 'R1 020', 'R2 100'], why: 'Year 1: R1 100. Year 2: R1 100 plus R110 is R1 210.' },
    ],
  },
  {
    id: 'debt',
    title: 'Debt and credit',
    lesson: [
      'Debt is money you borrow and must pay back with interest. Good debt can build your future, like a study loan. Bad debt pays for things that lose value.',
      'Always check the total cost: the amount plus interest and fees. A R5 000 loan can cost much more by the end.',
      'Pay on time to keep a good credit record. With several debts, pay the minimum on all and put extra on the one with the highest interest.',
    ],
    quiz: [
      { q: 'What is the total cost of a loan?', options: ['Amount + interest + fees', 'Only the amount', 'Only the fees', 'The first payment'], why: 'Interest and fees can add a lot to what you borrowed.' },
      { q: 'Paying a loan late usually...', options: ['Hurts your credit', 'Lowers interest', 'Cancels the debt', 'Is free'], why: 'Late payments add fees and damage your credit record.' },
      { q: 'Which debt should get extra payments first?', options: ['Highest interest', 'Lowest interest', 'The newest', 'The oldest'], why: 'Paying the most expensive debt first saves the most.' },
      { q: "Which is usually 'bad debt'?", options: ['A loan for a holiday', 'A study loan', 'A home loan', 'A business loan'], why: 'A holiday loan pays for something that is soon gone.' },
      { q: "A lender offers 'no credit checks, instant cash'. Be...", options: ['Careful, it costs', 'Excited', 'Quick to sign', 'Unworried'], why: 'Easy loans often hide very high interest and fees.' },
    ],
  },
  {
    id: 'scams',
    title: 'Spotting scams',
    lesson: [
      "Scammers pretend to be banks, SARS, delivery companies or prize givers. They want your PIN, OTP or a 'fee' paid first.",
      "Warning signs: urgency ('act now'), threats ('account blocked'), prizes you never entered, odd links, or requests to pay with airtime, vouchers or crypto.",
      'Banks never ask for your PIN, password or OTP. If unsure, hang up and call the number on your card. Use Scam check (option 5) to test a message.',
    ],
    quiz: [
      { q: 'An SMS from your bank asks for your OTP. You...', options: ['Never share it', 'Reply quickly', 'Share it once', 'Forward it'], why: 'Banks never ask for your OTP. Anyone who does is a scammer.' },
      { q: "You 'won' R10 000 but must pay R500 first. This is...", options: ['An advance-fee scam', 'A lucky day', 'Normal', 'A bank fee'], why: 'Real prizes never ask you to pay to receive them.' },
      { q: 'Which payment do scammers prefer?', options: ['Vouchers or airtime', 'EFT to a known shop', 'Card at a till', 'Your own debit order'], why: "Vouchers, airtime and crypto can't be reversed." },
      { q: "A message says 'act within 1 hour'. This is...", options: ['A pressure tactic', 'Good service', 'Required by law', 'Always real'], why: 'Scammers rush you so you don\'t stop and think.' },
      { q: 'How do you check a suspicious call is real?', options: ['Call the official line', 'Call the number given', 'Reply to the SMS', 'Click the link'], why: "Use the number on your card or the company's website." },
    ],
  },
  {
    id: 'bank-fees',
    title: 'Bank fees',
    lesson: [
      'Banks charge fees for things like monthly accounts, cash withdrawals, other banks\' ATMs and SMS notifications. Small fees add up.',
      'Check your statement for fees each month. A cheaper account, or a bundle that matches how you bank, can save hundreds a year.',
      "Tips: pay by card or app instead of drawing cash, use your own bank's ATMs, and avoid unpaid debit orders, which carry penalty fees.",
    ],
    quiz: [
      { q: 'How can you lower cash withdrawal fees?', options: ['Pay by card or app', 'Withdraw daily', 'Use any ATM', 'Ignore fees'], why: 'Card and app payments usually cost less than cash.' },
      { q: 'Where can you see what fees you paid?', options: ['Your bank statement', 'Your payslip', 'A till slip', 'Nowhere'], why: 'Your statement lists every fee the bank charged.' },
      { q: 'R60 in fees a month costs how much a year?', options: ['R720', 'R60', 'R360', 'R6 000'], why: 'R60 x 12 months is R720.' },
      { q: 'A debit order bounces. Usually you...', options: ['Pay a penalty fee', 'Get a refund', 'Earn interest', 'Pay nothing'], why: 'Unpaid debit orders often cost a fee from your bank.' },
      { q: 'When choosing a bank account, look for...', options: ['Fees that fit your use', 'The most features', 'The longest name', 'The biggest bank'], why: 'The best account is the one that suits how you bank.' },
    ],
  },
];

export const findLesson = (id) => LESSONS.find((lesson) => lesson.id === id);

/** Questions in random order, each with its options shuffled and the correct index tracked. */
export function shuffledQuiz(lesson) {
  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  return shuffle(lesson.quiz).map((item) => {
    const order = shuffle(item.options.map((_, index) => index));
    return {
      question: item.q,
      options: order.map((index) => item.options[index]),
      correctIndex: order.indexOf(0),
      explanation: item.why,
    };
  });
}
