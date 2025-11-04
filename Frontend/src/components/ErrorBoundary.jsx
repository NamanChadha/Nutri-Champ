import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(err){ return { hasError: true, error: err }; }
  componentDidCatch(err, info){ console.error("ErrorBoundary caught:", err, info); }
  render(){
    if (this.state.hasError) {
      return (
        <div style={{padding:30}}>
          <h2 style={{color:"#b91c1c"}}>Something failed to load.</h2>
          <pre style={{whiteSpace:"pre-wrap"}}>{String(this.state.error)}</pre>
          <button onClick={()=>location.reload()} style={{marginTop:12}}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
