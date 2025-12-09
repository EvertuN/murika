<!-- LOGS DO ADMIN -->
<div id="auth_admin_logs" class="section">
    <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
            <h4>Central de Logs</h4>
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-outline-primary active" onclick="filtrarLogsAdmin('all', this)">Todos</button>
                <button type="button" class="btn btn-outline-primary" onclick="filtrarLogsAdmin('access', this)">Acessos</button>
                <button type="button" class="btn btn-outline-primary" onclick="filtrarLogsAdmin('system', this)">Sistema</button>
                <button type="button" class="btn btn-outline-primary" onclick="filtrarLogsAdmin('reports', this)">Relatórios</button>
            </div>
        </div>
        
        <div id="mensagem-logs-admin"></div>
        
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Usuário</th>
                            <th>Ação</th>
                            <th>Detalhes</th>
                            <th>IP</th>
                        </tr>
                    </thead>
                    <tbody id="tabelaLogsAdmin">
                        <tr>
                            <td colspan="5" class="text-center">
                                <i class="fas fa-spinner fa-spin"></i> Carregando...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <nav class="mt-3">
                <ul class="pagination justify-content-center" id="paginacaoLogs">
                </ul>
            </nav>
        </div>
    </div>
</div>

