import React, { createContext, useReducer, useContext } from 'react';
import { transition } from '../utils/statusMachine';

const ExamStateContext = createContext();

const initialState = {
  sessionId: '',
  sections: {}, // { sectionName: { questionIds: [] } }
  questionsById: {}, // { id: { ...question, status: 'not_visited', selected: [] } }
  currentSection: '',
  activeQuestionId: '',
  timer: { remainingSeconds: 1800, isExpired: false, isRunning: false },
  submission: { submitted: false, summary: null },
  newQuestionsArrived: false,
};

const getNextQuestionId = (state, currentSection, activeQuestionId) => {
  const qIds = state.sections[currentSection]?.questionIds || [];
  const idx = qIds.indexOf(activeQuestionId);
  if (idx !== -1 && idx < qIds.length - 1) {
    return qIds[idx + 1];
  }
  return activeQuestionId;
};

const getPrevQuestionId = (state, currentSection, activeQuestionId) => {
  const qIds = state.sections[currentSection]?.questionIds || [];
  const idx = qIds.indexOf(activeQuestionId);
  if (idx > 0) {
    return qIds[idx - 1];
  }
  return activeQuestionId;
};

function examReducer(state, action) {
  switch (action.type) {
    case 'INIT_SESSION':
      return {
        ...initialState,
        sessionId: action.payload.sessionId,
        timer: {
          remainingSeconds: action.payload.durationSeconds || 1800,
          isExpired: false,
          isRunning: false
        }
      };

    case 'START_TIMER':
      return {
        ...state,
        timer: { ...state.timer, isRunning: true }
      };

    case 'MERGE_QUESTIONS': {
      const { questions } = action.payload;
      if (!questions || questions.length === 0) return state;

      const newSections = { ...state.sections };
      const newQuestionsById = { ...state.questionsById };

      questions.forEach((q) => {
        if (!newQuestionsById[q.id]) {
          newQuestionsById[q.id] = {
            ...q,
            status: 'not_visited',
            selected: [],
          };

          if (!newSections[q.section]) {
            newSections[q.section] = { questionIds: [] };
          }
          newSections[q.section].questionIds.push(q.id);
        }
      });

      let firstSection = state.currentSection;
      let firstQuestion = state.activeQuestionId;

      const sectionNames = Object.keys(newSections);
      if (!firstSection && sectionNames.length > 0) {
        firstSection = sectionNames[0];
        const qIds = newSections[firstSection].questionIds;
        if (qIds.length > 0) {
          firstQuestion = qIds[0];
          newQuestionsById[firstQuestion] = transition(newQuestionsById[firstQuestion], { type: 'VISIT' });
        }
      }

      return {
        ...state,
        sections: newSections,
        questionsById: newQuestionsById,
        currentSection: firstSection,
        activeQuestionId: firstQuestion,
        newQuestionsArrived: state.sessionId ? true : false,
      };
    }

    case 'CLEAR_ARRIVED_ALERT':
      return {
        ...state,
        newQuestionsArrived: false
      };

    case 'NAVIGATE_QUESTION': {
      const { questionId } = action.payload;
      const targetQuestion = state.questionsById[questionId];
      if (!targetQuestion) return state;

      const newQuestionsById = { ...state.questionsById };
      newQuestionsById[questionId] = transition(targetQuestion, { type: 'VISIT' });

      return {
        ...state,
        activeQuestionId: questionId,
        currentSection: targetQuestion.section,
        questionsById: newQuestionsById
      };
    }

    case 'SELECT_OPTION': {
      const { selected } = action.payload;
      const activeQ = state.questionsById[state.activeQuestionId];
      if (!activeQ) return state;

      return {
        ...state,
        questionsById: {
          ...state.questionsById,
          [state.activeQuestionId]: {
            ...activeQ,
            selected
          }
        }
      };
    }

    case 'CLEAR_RESPONSE': {
      const activeQ = state.questionsById[state.activeQuestionId];
      if (!activeQ) return state;

      const updatedQ = transition(activeQ, { type: 'CLEAR' });
      return {
        ...state,
        questionsById: {
          ...state.questionsById,
          [state.activeQuestionId]: updatedQ
        }
      };
    }

    case 'SAVE_NEXT': {
      const activeQ = state.questionsById[state.activeQuestionId];
      if (!activeQ) return state;

      const updatedQ = transition(activeQ, {
        type: 'SAVE_NEXT',
        selected: activeQ.selected
      });

      const nextQId = getNextQuestionId(state, state.currentSection, state.activeQuestionId);

      const newQuestionsById = {
        ...state.questionsById,
        [state.activeQuestionId]: updatedQ
      };

      if (nextQId !== state.activeQuestionId) {
        newQuestionsById[nextQId] = transition(newQuestionsById[nextQId], { type: 'VISIT' });
      }

      return {
        ...state,
        questionsById: newQuestionsById,
        activeQuestionId: nextQId
      };
    }

    case 'MARK_REVIEW_NEXT': {
      const activeQ = state.questionsById[state.activeQuestionId];
      if (!activeQ) return state;

      const updatedQ = transition(activeQ, {
        type: 'MARK_REVIEW',
        selected: activeQ.selected
      });

      const nextQId = getNextQuestionId(state, state.currentSection, state.activeQuestionId);

      const newQuestionsById = {
        ...state.questionsById,
        [state.activeQuestionId]: updatedQ
      };

      if (nextQId !== state.activeQuestionId) {
        newQuestionsById[nextQId] = transition(newQuestionsById[nextQId], { type: 'VISIT' });
      }

      return {
        ...state,
        questionsById: newQuestionsById,
        activeQuestionId: nextQId
      };
    }

    case 'NAVIGATE_PREV': {
      const prevQId = getPrevQuestionId(state, state.currentSection, state.activeQuestionId);
      const newQuestionsById = { ...state.questionsById };

      if (prevQId !== state.activeQuestionId) {
        newQuestionsById[prevQId] = transition(newQuestionsById[prevQId], { type: 'VISIT' });
      }

      return {
        ...state,
        questionsById: newQuestionsById,
        activeQuestionId: prevQId
      };
    }

    case 'UPDATE_TIMER':
      return {
        ...state,
        timer: {
          ...state.timer,
          remainingSeconds: Math.max(0, state.timer.remainingSeconds - 1)
        }
      };

    case 'EXPIRE_TIMER': {
      const summary = generateSummary(state);
      return {
        ...state,
        timer: { ...state.timer, remainingSeconds: 0, isExpired: true, isRunning: false },
        submission: { submitted: true, summary }
      };
    }

    case 'SUBMIT_EXAM': {
      const summary = generateSummary(state);
      return {
        ...state,
        timer: { ...state.timer, isRunning: false },
        submission: { submitted: true, summary }
      };
    }

    case 'RESET_SESSION':
      return initialState;

    default:
      return state;
  }
}

function generateSummary(state) {
  const questions = Object.values(state.questionsById);
  const total = questions.length;
  let answered = 0;
  let notAnswered = 0;
  let marked = 0;
  let answeredMarked = 0;
  let notVisited = 0;

  questions.forEach(q => {
    switch (q.status) {
      case 'answered':
        answered++;
        break;
      case 'not_answered':
        notAnswered++;
        break;
      case 'marked':
        marked++;
        break;
      case 'answered_marked':
        answeredMarked++;
        break;
      case 'not_visited':
        notVisited++;
        break;
      default:
        break;
    }
  });

  const sectionBreakdown = {};
  Object.keys(state.sections).forEach(secName => {
    const qIds = state.sections[secName].questionIds;
    let secAnswered = 0;
    let secNotAnswered = 0;
    let secMarked = 0;
    let secAnsweredMarked = 0;
    let secNotVisited = 0;

    qIds.forEach(qId => {
      const q = state.questionsById[qId];
      if (q) {
        switch (q.status) {
          case 'answered': secAnswered++; break;
          case 'not_answered': secNotAnswered++; break;
          case 'marked': secMarked++; break;
          case 'answered_marked': secAnsweredMarked++; break;
          case 'not_visited': secNotVisited++; break;
          default: break;
        }
      }
    });

    sectionBreakdown[secName] = {
      total: qIds.length,
      answered: secAnswered,
      notAnswered: secNotAnswered,
      marked: secMarked,
      answeredMarked: secAnsweredMarked,
      notVisited: secNotVisited
    };
  });

  return {
    total,
    answered,
    notAnswered,
    marked,
    answeredMarked,
    notVisited,
    sectionBreakdown
  };
}

export function ExamStateProvider({ children }) {
  const [state, dispatch] = useReducer(examReducer, initialState);
  return (
    <ExamStateContext.Provider value={{ state, dispatch }}>
      {children}
    </ExamStateContext.Provider>
  );
}

export function useExamState() {
  const context = useContext(ExamStateContext);
  if (!context) {
    throw new Error('useExamState must be used within an ExamStateProvider');
  }
  return context;
}
