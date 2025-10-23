// Mock for react-router-dom
export const BrowserRouter = ({ children }) => children;
export const Routes = ({ children }) => children;
export const Route = ({ element }) => element;
export const useNavigate = () => jest.fn();
export const useLocation = () => ({ pathname: '/' });
export const useParams = () => ({ examId: 'test-exam' });
export const Link = ({ children, to }) => <a href={to}>{children}</a>;
export const Navigate = ({ to }) => <div>Navigate to {to}</div>;
