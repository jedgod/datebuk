import React, { useEffect, useMemo, useState } from 'react';
import { PageFrame, ContentCard } from '../components/PageFrame';
import ActionDrawer from '../components/ActionDrawer';
import { api } from '../lib/api';

export default function PremiumSafetyPage({ group, selectedItem }) {
  const [safetyCenter, setSafetyCenter] = useState(null);
  const [moderationSnapshot, setModerationSnapshot] = useState(null);
  const [moderationPagination, setModerationPagination] = useState({ page: 1, pageSize: 6, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [moderationFilters, setModerationFilters] = useState({ status: '', priority: '', type: '', search: '' });
  const [tickets, setTickets] = useState([]);
  const [ticketPagination, setTicketPagination] = useState({ page: 1, pageSize: 6, total: 0, totalPages: 1, hasNext: false, hasPrev: false });
  const [ticketFilters, setTicketFilters] = useState({ status: '', priority: '', search: '' });
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [selectedModerationId, setSelectedModerationId] = useState('');
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const activeTicket = useMemo(() => tickets.find((ticket) => ticket.id === selectedTicketId) || null, [tickets, selectedTicketId]);
  const activeModeration = useMemo(() => {
    const queue = moderationSnapshot?.queue || [];
    return queue.find((entry) => entry.id === selectedModerationId) || null;
  }, [moderationSnapshot, selectedModerationId]);

  const loadSafetyData = () => {
    api.get('/api/safety/center')
      .then((safetyData) => {
        setSafetyCenter(safetyData);
        setLoadError('');
      })
      .catch((err) => {
        setLoadError(err.message || 'Unable to load safety data');
      });
  };

  const loadModeration = () => {
    api.get('/api/admin/moderation', {
      page: moderationPagination.page,
      pageSize: moderationPagination.pageSize,
      status: moderationFilters.status,
      priority: moderationFilters.priority,
      type: moderationFilters.type,
      search: moderationFilters.search,
    })
      .then((moderationData) => {
        setModerationSnapshot(moderationData);
        setModerationPagination((prev) => ({
          ...prev,
          ...(moderationData?.pagination || {}),
        }));
      })
      .catch((err) => {
        setLoadError(err.message || 'Unable to load moderation data');
      });
  };

  const loadTickets = () => {
    api.get('/api/tickets', {
      page: ticketPagination.page,
      pageSize: ticketPagination.pageSize,
      status: ticketFilters.status,
      priority: ticketFilters.priority,
      search: ticketFilters.search,
    })
      .then((ticketData) => {
        setTickets(Array.isArray(ticketData?.items) ? ticketData.items : []);
        setTicketPagination((prev) => ({
          ...prev,
          ...(ticketData?.pagination || {}),
        }));
      })
      .catch((err) => {
        setLoadError(err.message || 'Unable to load ticket data');
      });
  };

  useEffect(() => {
    loadSafetyData();
  }, []);

  useEffect(() => {
    loadModeration();
  }, [moderationPagination.page, moderationPagination.pageSize, moderationFilters.status, moderationFilters.priority, moderationFilters.type, moderationFilters.search]);

  useEffect(() => {
    loadTickets();
  }, [ticketPagination.page, ticketPagination.pageSize, ticketFilters.status, ticketFilters.priority, ticketFilters.search]);

  const updateTicketStatus = async (status) => {
    if (!activeTicket) return;
    const previousTickets = tickets;
    const ticketId = activeTicket.id;
    setActionLoading(true);
    setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, status } : ticket)));
    try {
      await api.patch(`/api/tickets/${ticketId}`, { status });
      setActionError('');
      loadTickets();
    } catch (err) {
      setTickets(previousTickets);
      setActionError(err.message || 'Failed to update ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const updateModerationStatus = async (status) => {
    if (!activeModeration) return;
    const previousSnapshot = moderationSnapshot;
    const moderationId = activeModeration.id;
    setActionLoading(true);
    setModerationSnapshot((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        queue: (prev.queue || []).map((entry) => (entry.id === moderationId ? { ...entry, status } : entry)),
      };
    });
    try {
      await api.patch(`/api/admin/moderation/${moderationId}`, { status });
      setActionError('');
      loadModeration();
    } catch (err) {
      setModerationSnapshot(previousSnapshot);
      setActionError(err.message || 'Failed to update moderation item');
    } finally {
      setActionLoading(false);
    }
  };

  const applyTicketFilters = (event) => {
    event.preventDefault();
    setTicketPagination((prev) => ({ ...prev, page: 1 }));
    loadTickets();
  };

  const applyModerationFilters = (event) => {
    event.preventDefault();
    setModerationPagination((prev) => ({ ...prev, page: 1 }));
    loadModeration();
  };

  return (
    <>
      <PageFrame
        variant="safety"
        eyebrow={group.title}
        title={selectedItem?.name || 'Premium + Safety'}
        summary={selectedItem?.description || 'Premium plan controls, safety tools, rewards and support workflows.'}
        asideTitle="Trust and value"
        asideSubtitle={safetyCenter && moderationSnapshot ? `Safety score ${safetyCenter.safetyScore}% · ${moderationSnapshot.stats.pending} pending reviews` : 'Loading operational metrics...'}
        asideChildren={(
          <div className="listGrid">
            {(safetyCenter?.modules || []).map((moduleName) => (
              <div className="listRow" key={moduleName}>{moduleName}</div>
            ))}
            {!safetyCenter ? <div className="listRow">Loading safety modules...</div> : null}
          </div>
        )}
      >
        {loadError ? <div className="errorCard">{loadError}</div> : null}
        {actionError ? <div className="errorCard">{actionError}</div> : null}

        <section className="opsGrid">
          <article className="panel">
            <div className="panelHead">
              <div>
                <h3>Moderation queue</h3>
                <p>Admin review visibility</p>
              </div>
            </div>
            <div className="panelBody">
              <form className="filterRow" onSubmit={applyModerationFilters}>
                <select value={moderationFilters.status} onChange={(event) => setModerationFilters((prev) => ({ ...prev, status: event.target.value }))}>
                  <option value="">All status</option>
                  <option value="PENDING">Pending</option>
                  <option value="REVIEWING">Reviewing</option>
                  <option value="ACTIONED">Actioned</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>
                <select value={moderationFilters.priority} onChange={(event) => setModerationFilters((prev) => ({ ...prev, priority: event.target.value }))}>
                  <option value="">All priority</option>
                  <option value="HIGH">High</option>
                  <option value="NORMAL">Normal</option>
                </select>
                <input value={moderationFilters.type} onChange={(event) => setModerationFilters((prev) => ({ ...prev, type: event.target.value }))} placeholder="Type" />
                <input value={moderationFilters.search} onChange={(event) => setModerationFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="Search moderation" />
                <button className="secondary" type="submit">Apply</button>
              </form>
              <div className="listGrid">
                {(moderationSnapshot?.queue || []).map((entry) => (
                  <button className="listRow listButton" key={entry.id} onClick={() => setSelectedModerationId(entry.id)}>
                    {entry.id} · {entry.type} · {entry.priority} · {entry.status}
                  </button>
                ))}
                {(moderationSnapshot?.queue || []).length === 0 ? <div className="listRow">No moderation entries.</div> : null}
              </div>
              <div className="pagerRow">
                <button className="secondary" onClick={() => setModerationPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={!moderationPagination.hasPrev}>Prev</button>
                <span>Page {moderationPagination.page} of {moderationPagination.totalPages}</span>
                <button className="secondary" onClick={() => setModerationPagination((prev) => ({ ...prev, page: prev.page + 1 }))} disabled={!moderationPagination.hasNext}>Next</button>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="panelHead">
              <div>
                <h3>Support tickets</h3>
                <p>Production support triage</p>
              </div>
            </div>
            <div className="panelBody">
              <form className="filterRow" onSubmit={applyTicketFilters}>
                <select value={ticketFilters.status} onChange={(event) => setTicketFilters((prev) => ({ ...prev, status: event.target.value }))}>
                  <option value="">All status</option>
                  <option value="OPEN">Open</option>
                  <option value="PENDING">Pending</option>
                  <option value="REVIEWING">Reviewing</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
                <select value={ticketFilters.priority} onChange={(event) => setTicketFilters((prev) => ({ ...prev, priority: event.target.value }))}>
                  <option value="">All priority</option>
                  <option value="HIGH">High</option>
                  <option value="NORMAL">Normal</option>
                </select>
                <input
                  value={ticketFilters.search}
                  onChange={(event) => setTicketFilters((prev) => ({ ...prev, search: event.target.value }))}
                  placeholder="Search ticket"
                />
                <button className="secondary" type="submit">Apply</button>
              </form>
              <div className="listGrid">
                {tickets.map((ticket) => (
                  <button className="listRow listButton" key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)}>
                    {ticket.id} · {ticket.title} · {ticket.status}
                  </button>
                ))}
                {tickets.length === 0 ? <div className="listRow">No active support tickets.</div> : null}
              </div>
              <div className="pagerRow">
                <button className="secondary" onClick={() => setTicketPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={!ticketPagination.hasPrev}>Prev</button>
                <span>Page {ticketPagination.page} of {ticketPagination.totalPages}</span>
                <button className="secondary" onClick={() => setTicketPagination((prev) => ({ ...prev, page: prev.page + 1 }))} disabled={!ticketPagination.hasNext}>Next</button>
              </div>
            </div>
          </article>
        </section>

        <section className="featureStrip">
          {group.items.map((item) => (
            <ContentCard key={item.slug} title={item.name} description={item.description} tone="safety" actionLabel={item.slug === selectedItem?.slug ? 'Selected' : 'Open module'} />
          ))}
        </section>
      </PageFrame>

      <ActionDrawer
        open={Boolean(activeTicket)}
        title={activeTicket ? `${activeTicket.id} · ${activeTicket.title}` : 'Ticket details'}
        subtitle={activeTicket ? `Priority ${activeTicket.priority} · Status ${activeTicket.status}` : ''}
        onClose={() => setSelectedTicketId('')}
      >
        {activeTicket ? (
          <div className="drawerActions">
            <p>{activeTicket.details || 'No additional details available.'}</p>
            <button className="primary" onClick={() => updateTicketStatus('REVIEWING')} disabled={actionLoading}>Mark Reviewing</button>
            <button className="secondary" onClick={() => updateTicketStatus('RESOLVED')} disabled={actionLoading}>Resolve Ticket</button>
          </div>
        ) : null}
      </ActionDrawer>

      <ActionDrawer
        open={Boolean(activeModeration)}
        title={activeModeration ? `${activeModeration.id} · ${activeModeration.type}` : 'Moderation details'}
        subtitle={activeModeration ? `${activeModeration.priority} priority · ${activeModeration.status}` : ''}
        onClose={() => setSelectedModerationId('')}
      >
        {activeModeration ? (
          <div className="drawerActions">
            <p>{activeModeration.reason || 'No reason provided.'}</p>
            <button className="primary" onClick={() => updateModerationStatus('ACTIONED')} disabled={actionLoading}>Approve Action</button>
            <button className="secondary" onClick={() => updateModerationStatus('DISMISSED')} disabled={actionLoading}>Dismiss Case</button>
          </div>
        ) : null}
      </ActionDrawer>
    </>
  );
}
