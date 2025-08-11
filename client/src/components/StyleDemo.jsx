import React from 'react';

const StyleDemo = () => {
  return (
    <div className="container-fluid py-4">
      <div className="modern-card mb-4">
        <div className="modern-card-header">
          <h2 className="mb-0">🎨 Modern UI Components Demo</h2>
        </div>
        <div className="modern-card-body">
          
          {/* Button Showcase */}
          <section className="mb-5">
            <h3 className="mb-3">🔘 Button Styles with Enhanced Shadows</h3>
            <div className="modern-grid mb-3">
              <button className="modern-btn modern-btn-primary">
                <i className="fas fa-rocket"></i>
                Primary Button
              </button>
              <button className="modern-btn modern-btn-secondary">
                <i className="fas fa-cog"></i>
                Secondary Button
              </button>
              <button className="modern-btn modern-btn-outline">
                <i className="fas fa-edit"></i>
                Outline Button
              </button>
              <button className="modern-btn modern-btn-success">
                <i className="fas fa-check"></i>
                Success Button
              </button>
            </div>
            
            <div className="modern-grid mb-3">
              <button className="modern-btn modern-btn-warning">
                <i className="fas fa-exclamation-triangle"></i>
                Warning Button
              </button>
              <button className="modern-btn modern-btn-danger">
                <i className="fas fa-trash"></i>
                Danger Button
              </button>
              <button className="modern-btn modern-btn-primary modern-btn-lg">
                <i className="fas fa-star"></i>
                Large Button
              </button>
              <button className="modern-btn modern-btn-secondary modern-btn-sm">
                <i className="fas fa-info"></i>
                Small Button
              </button>
            </div>
          </section>

          {/* Card Showcase */}
          <section className="mb-5">
            <h3 className="mb-3">📋 Card Styles with Box Shadows</h3>
            <div className="modern-grid">
              
              {/* Standard Card */}
              <div className="modern-card">
                <div className="modern-card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-cube me-2 text-primary"></i>
                    Standard Card
                  </h5>
                </div>
                <div className="modern-card-body">
                  <p className="text-muted mb-3">
                    This card uses standard shadow effects with hover animations.
                  </p>
                  <button className="modern-btn modern-btn-primary modern-btn-sm">
                    Learn More
                  </button>
                </div>
              </div>

              {/* Elevated Card */}
              <div className="modern-card modern-card-elevated">
                <div className="modern-card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-layer-group me-2 text-success"></i>
                    Elevated Card
                  </h5>
                </div>
                <div className="modern-card-body">
                  <p className="text-muted mb-3">
                    This card has enhanced shadows for more prominent display.
                  </p>
                  <button className="modern-btn modern-btn-success modern-btn-sm">
                    Explore
                  </button>
                </div>
              </div>

              {/* Gradient Border Card */}
              <div className="modern-card modern-card-gradient">
                <div className="modern-card-header">
                  <h5 className="mb-0">
                    <i className="fas fa-palette me-2 text-warning"></i>
                    Gradient Border
                  </h5>
                </div>
                <div className="modern-card-body">
                  <p className="text-muted mb-3">
                    This card features a beautiful gradient border effect.
                  </p>
                  <button className="modern-btn modern-btn-outline modern-btn-sm">
                    Discover
                  </button>
                </div>
              </div>

            </div>
          </section>

          {/* Stats Cards */}
          <section className="mb-4">
            <h3 className="mb-3">📊 Statistics Cards with Shadows</h3>
            <div className="modern-stats-grid">
              <div className="modern-stat-card">
                <div className="modern-stat-number">2,847</div>
                <div className="modern-stat-label">🏗️ Active Projects</div>
              </div>
              <div className="modern-stat-card">
                <div className="modern-stat-number">15,392</div>
                <div className="modern-stat-label">📋 Reports Generated</div>
              </div>
              <div className="modern-stat-card">
                <div className="modern-stat-number">98.5%</div>
                <div className="modern-stat-label">✅ Success Rate</div>
              </div>
              <div className="modern-stat-card">
                <div className="modern-stat-number">24/7</div>
                <div className="modern-stat-label">🔧 System Uptime</div>
              </div>
            </div>
          </section>

          {/* Shadow Examples */}
          <section>
            <h3 className="mb-3">🌟 Shadow Levels Demo</h3>
            <div className="row g-3">
              <div className="col-md-2">
                <div className="p-3 bg-white rounded text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <small className="text-muted">Small Shadow</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="p-3 bg-white rounded text-center" style={{ boxShadow: 'var(--shadow-md)' }}>
                  <small className="text-muted">Medium Shadow</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="p-3 bg-white rounded text-center" style={{ boxShadow: 'var(--shadow-lg)' }}>
                  <small className="text-muted">Large Shadow</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="p-3 bg-white rounded text-center" style={{ boxShadow: 'var(--shadow-xl)' }}>
                  <small className="text-muted">Extra Large</small>
                </div>
              </div>
              <div className="col-md-2">
                <div className="p-3 bg-white rounded text-center" style={{ boxShadow: 'var(--shadow-2xl)' }}>
                  <small className="text-muted">2XL Shadow</small>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default StyleDemo;
