import React from "react"
import i18n from "i18next"

import ErrorPage from "../pages/ErrorPage"

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage code={500} message={this.state.error?.message || i18n.t("error.somethingWentWrong")} />
    }

    return this.props.children
  }
}

export default ErrorBoundary
