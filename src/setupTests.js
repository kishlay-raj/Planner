import '@testing-library/jest-dom';

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// Mock drag and drop
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) => 
    children({
      draggableProps: {
        style: {},
      },
      innerRef: jest.fn(),
      placeholder: null,
      droppableProps: {},
      provided: {
        innerRef: jest.fn(),
        droppableProps: {},
        placeholder: null
      }
    }),
  Draggable: ({ children }) => 
    children({
      draggableProps: {
        style: {},
      },
      innerRef: jest.fn(),
      dragHandleProps: {},
      draggableProps: {},
      provided: {
        innerRef: jest.fn(),
        draggableProps: {},
        dragHandleProps: {}
      }
    }),
}));

// Mock react-big-calendar
jest.mock('react-big-calendar', () => ({
  Calendar: () => <div data-testid="calendar">Calendar Mock</div>,
  dateFnsLocalizer: jest.fn()
}));

jest.mock('react-big-calendar/lib/addons/dragAndDrop', () => () => 
  function DragAndDropCalendar(props) {
    return <div data-testid="calendar">DnD Calendar Mock</div>;
  }
); 