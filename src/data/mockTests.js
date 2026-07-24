export const MOCK_TESTS = [
  {
    id: 'afcat-mock-1',
    category: 'Defense',
    categoryBadge: 'AFCAT 2026',
    title: 'AFCAT 2026 Full Length Mock Test 01',
    description: 'Comprehensive test covering Verbal Ability, Numerical Ability, Reasoning, and General Awareness under TCS iON rules.',
    durationMins: 10,
    questionsCount: 10,
    totalMarks: 30,
    languages: ['English'],
    questions: [
      {
        id: 'q_afcat_1',
        section: 'General Awareness',
        type: 'single',
        text: 'Which Indian Armed Force recently participated in Exercise Desert Knight alongside French and UAE air forces?',
        options: [
          { id: 'opt_1', text: 'Indian Air Force' },
          { id: 'opt_2', text: 'Indian Navy' },
          { id: 'opt_3', text: 'Indian Army' },
          { id: 'opt_4', text: 'Indian Coast Guard' }
        ]
      },
      {
        id: 'q_afcat_2',
        section: 'Verbal Ability',
        type: 'single',
        text: 'Select the antonym for the word: "EPHEMERAL".',
        options: [
          { id: 'opt_1', text: 'Transient' },
          { id: 'opt_2', text: 'Perpetual' },
          { id: 'opt_3', text: 'Fleeting' },
          { id: 'opt_4', text: 'Evanescent' }
        ]
      },
      {
        id: 'q_afcat_3',
        section: 'Numerical Ability',
        type: 'single',
        text: 'A train 150 meters long crosses a telegraph post in 12 seconds. What is the speed of the train in km/h?',
        options: [
          { id: 'opt_1', text: '45 km/h' },
          { id: 'opt_2', text: '50 km/h' },
          { id: 'opt_3', text: '36 km/h' },
          { id: 'opt_4', text: '54 km/h' }
        ]
      },
      {
        id: 'q_afcat_4',
        section: 'Reasoning & Military Aptitude',
        type: 'single',
        text: 'Find the odd one out among the given options: Commodore, Brigadier, Air Commodore, Rear Admiral.',
        options: [
          { id: 'opt_1', text: 'Brigadier' },
          { id: 'opt_2', text: 'Commodore' },
          { id: 'opt_3', text: 'Air Commodore' },
          { id: 'opt_4', text: 'Rear Admiral' }
        ]
      }
    ]
  },
  {
    id: 'rpf-constable-1',
    category: 'Railways',
    categoryBadge: 'RPF Constable',
    title: 'RPF Constable & SI CBT Practice Set 01',
    description: 'Designed as per Railway Protection Force Computer Based Test blueprint focusing on Arithmetic and General Intelligence.',
    durationMins: 10,
    questionsCount: 8,
    totalMarks: 24,
    languages: ['English', 'Hindi'],
    questions: [
      {
        id: 'q_rpf_1',
        section: 'General Awareness',
        type: 'single',
        text: 'Which Article of the Indian Constitution empowers the President to declare a Financial Emergency?',
        options: [
          { id: 'opt_1', text: 'Article 352' },
          { id: 'opt_2', text: 'Article 356' },
          { id: 'opt_3', text: 'Article 360' },
          { id: 'opt_4', text: 'Article 370' }
        ]
      },
      {
        id: 'q_rpf_2',
        section: 'Arithmetic',
        type: 'single',
        text: 'The average of 5 consecutive numbers is 20. What is the largest of these numbers?',
        options: [
          { id: 'opt_1', text: '22' },
          { id: 'opt_2', text: '24' },
          { id: 'opt_3', text: '21' },
          { id: 'opt_4', text: '23' }
        ]
      },
      {
        id: 'q_rpf_3',
        section: 'General Intelligence',
        type: 'single',
        text: 'If CAB is coded as 6 and BED is coded as 40, how is CAT coded?',
        options: [
          { id: 'opt_1', text: '60' },
          { id: 'opt_2', text: '120' },
          { id: 'opt_3', text: '480' },
          { id: 'opt_4', text: '360' }
        ]
      }
    ]
  },
  {
    id: 'ssc-cgl-tier1',
    category: 'SSC',
    categoryBadge: 'SSC CGL',
    title: 'SSC CGL Tier-I General Practice Test',
    description: 'Covers General Intelligence, General Awareness, Quantitative Aptitude, and English Comprehension.',
    durationMins: 15,
    questionsCount: 12,
    totalMarks: 50,
    languages: ['English', 'Hindi'],
    questions: [
      {
        id: 'q_ssc_1',
        section: 'Quantitative Aptitude',
        type: 'single',
        text: 'If x + (1/x) = 4, then find the value of x² + (1/x²).',
        options: [
          { id: 'opt_1', text: '14' },
          { id: 'opt_2', text: '16' },
          { id: 'opt_3', text: '18' },
          { id: 'opt_4', text: '12' }
        ]
      },
      {
        id: 'q_ssc_2',
        section: 'General Reasoning',
        type: 'single',
        text: 'Complete the series: 3, 7, 15, 31, 63, ?',
        options: [
          { id: 'opt_1', text: '127' },
          { id: 'opt_2', text: '125' },
          { id: 'opt_3', text: '128' },
          { id: 'opt_4', text: '126' }
        ]
      }
    ]
  },
  {
    id: 'rrb-ntpc-cbt1',
    category: 'Railways',
    categoryBadge: 'RRB NTPC',
    title: 'RRB NTPC CBT-1 Stage Practice Paper',
    description: 'Simulates official Railway Recruitment Board CBT-1 test pattern with timer and palette constraints.',
    durationMins: 10,
    questionsCount: 10,
    totalMarks: 30,
    languages: ['English', 'Hindi'],
    questions: [
      {
        id: 'q_rrb_1',
        section: 'General Science',
        type: 'single',
        text: 'Which element has the highest electrical conductivity among all metals?',
        options: [
          { id: 'opt_1', text: 'Copper' },
          { id: 'opt_2', text: 'Silver' },
          { id: 'opt_3', text: 'Gold' },
          { id: 'opt_4', text: 'Aluminium' }
        ]
      }
    ]
  },
  {
    id: 'gate-aptitude',
    category: 'Engineering',
    categoryBadge: 'GATE 2026',
    title: 'GATE General Aptitude & Spatial Reasoning Set',
    description: 'Focuses on Verbal Aptitude, Analytical Aptitude, and Spatial Aptitude for GATE aspirants.',
    durationMins: 15,
    questionsCount: 8,
    totalMarks: 15,
    languages: ['English'],
    questions: [
      {
        id: 'q_gate_1',
        section: 'General Aptitude',
        type: 'single',
        text: 'The ratio of the number of boys to girls in a class is 3 : 2. If 20% of boys and 25% of girls are scholarship holders, what percentage of students do NOT get scholarships?',
        options: [
          { id: 'opt_1', text: '78%' },
          { id: 'opt_2', text: '75%' },
          { id: 'opt_3', text: '80%' },
          { id: 'opt_4', text: '72%' }
        ]
      }
    ]
  }
];
