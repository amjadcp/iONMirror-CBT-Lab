export function transition(question, action) {
  const hasSelection = action.selected && action.selected.length > 0;

  switch (action.type) {
    case 'VISIT':
      if (question.status === 'not_visited') {
        return { ...question, status: 'not_answered' };
      }
      return question;
    case 'SAVE_NEXT':
      if (hasSelection) {
        return { ...question, status: 'answered', selected: action.selected };
      }
      // If nothing selected, keep current state (usually not_answered) but preserve empty selections if cleared
      return question;
    case 'MARK_REVIEW':
      return {
        ...question,
        status: hasSelection ? 'answered_marked' : 'marked',
        selected: action.selected || question.selected
      };
    case 'CLEAR':
      return { ...question, status: 'not_answered', selected: [] };
    default:
      return question;
  }
}
