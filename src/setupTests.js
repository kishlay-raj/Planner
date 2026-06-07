import '@testing-library/jest-dom';

// Define global setImmediate and clearImmediate if they do not exist
global.setImmediate = global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));
global.clearImmediate = global.clearImmediate || ((id) => global.clearTimeout(id));

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: function () { },
    removeListener: function () { }
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
    }, {
      isDragging: false,
      isDropAnimating: false,
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