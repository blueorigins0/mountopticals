import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  onError?: () => void;
}

interface State {
  hasError: boolean;
}

export default class ModelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
