import React, { useEffect, useState } from 'react';
import { PageFrame } from '../components/PageFrame';
import { api } from '../lib/api';

export default function AdminAuditLogPage({ group, selectedItem }) {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 8, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [filters, setFilters] = useState({ actor: '', action: '', target: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get('/api/admin/audit-logs', {
      page: pagination.page,
      pageSize: pagination.pageSize,
      actor: filters.actor,
      action: filters.action,
      target: filters.target,
      search: filters.search,
    })
      .then((data) => {
        if (!active) return;
        setLogs(Array.isArray(data?.items) ? data.items : []);
        setPagination((prev) => ({ ...prev, ...(data?.pagination || {}) }));
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Failed to load audit logs');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pagination.page, pagination.pageSize, filters.actor, filters.action, filters.target, filters.search]);

  const applyFilters = (event) => {
    event.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <PageFrame
      eyebrow={group.title}
      title={selectedItem?.name || 'Audit Log Timeline'}
      summary={selectedItem?.description || 'Track moderation and support operations with a full decision timeline.'}
      asideTitle="Operations trace"
      asideSubtitle="Compliance-ready timeline"
      asideChildren={(
        <div className="listGrid">
          <div className="listRow">Moderation decisions</div>
          <div className="listRow">Support lifecycle updates</div>
          <div className="listRow">Policy and risk actions</div>
        </div>
      )}
    >
      <form className="filterRow" onSubmit={applyFilters}>
        <input value={filters.actor} onChange={(event) => setFilters((prev) => ({ ...prev, actor: event.target.value }))} placeholder="Actor" />
        <input value={filters.action} onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value }))} placeholder="Action" />
        <input value={filters.target} onChange={(event) => setFilters((prev) => ({ ...prev, target: event.target.value }))} placeholder="Target" />
        <input value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="Search" />
        <button className="secondary" type="submit">Apply</button>
      </form>
      {loading ? <div className="loadingCard">Loading audit timeline...</div> : null}
      {error ? <div className="errorCard">{error}</div> : null}
      {!loading && !error ? (
        <>
          <section className="timeline">
            {logs.map((log) => (
              <article className="timelineItem" key={log.id}>
                <div className="timelineDot" />
                <div className="timelineContent">
                  <p className="timelineMeta">{new Date(log.createdAt).toLocaleString()} · {log.actor}</p>
                  <h3>{log.action}</h3>
                  <p>Target: {log.target}</p>
                  <p>Outcome: {log.result}</p>
                </div>
              </article>
            ))}
            {logs.length === 0 ? <div className="listRow">No audit events found for current filters.</div> : null}
          </section>
          <div className="pagerRow">
            <button className="secondary" onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={!pagination.hasPrev}>Prev</button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button className="secondary" onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))} disabled={!pagination.hasNext}>Next</button>
          </div>
        </>
      ) : null}
    </PageFrame>
  );
}
