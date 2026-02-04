from core.orchestration.orchestrator import Orchestrator


def test_orchestrator_topo_sort_runs():
    inp = {"system_id": "smoke"}
    orch = Orchestrator(inp)
    res = orch.run()
    assert res.success
