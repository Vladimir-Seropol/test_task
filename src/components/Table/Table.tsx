/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "../Button/Button";
import styles from "./Table.module.css";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { createRef } from "react";

interface Post {
  id: number;
  title: string;
  body: string;
}

interface TableState {
  searchQuery: string;
  idFilter: string;
  sortField: "id" | "title" | null;
  sortOrder: "asc" | "desc";
  page: number;
}

const saveToLocalStorage = (key: string, value: TableState) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const loadFromLocalStorage = (
  key: string,
  defaultValue: TableState
): TableState => {
  const storedValue = localStorage.getItem(key);
  return storedValue ? JSON.parse(storedValue) : defaultValue;
};

const Table: React.FC = () => {
  const [data, setData] = useState<Post[]>([]);
  const [filteredData, setFilteredData] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setSearchParams] = useSearchParams();
  const [state, setState] = useState<TableState>(
    loadFromLocalStorage("tableState", {
      searchQuery: "",
      idFilter: "",
      sortField: null,
      sortOrder: "asc",
      page: 1,
    })
  );

  const itemsPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "https://jsonplaceholder.typicode.com/posts"
        );
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        const result: Post[] = await response.json();
        setData(result);
        setFilteredData(result);
      } catch (err: any) {
        if (err.name === "TypeError") {
          setError("Проблемы с подключением к сети. Проверьте интернет.");
        } else {
          setError(err.message || "Не удалось получить данные.");
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);
  

  useEffect(() => {
    let filtered = data;

    if (state.searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          item.body.toLowerCase().includes(state.searchQuery.toLowerCase())
      );
    }

    const [minId, maxId] = state.idFilter
      .split("-")
      .map((val) => Math.max(1, Math.min(100, parseInt(val, 10))));

    if (!isNaN(minId) && !isNaN(maxId)) {
      filtered = filtered.filter(
        (item) => item.id >= minId && item.id <= maxId
      );
    }

    if (state.sortField) {
      filtered = filtered.sort((a, b) => {
        const aValue = a[state.sortField!];
        const bValue = b[state.sortField!];
        if (aValue < bValue) return state.sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return state.sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredData(filtered);
  }, [data, state]);

  useEffect(() => {
    saveToLocalStorage("tableState", state);
    setSearchParams({
      searchQuery: state.searchQuery,
      idFilter: state.idFilter,
      sortField: state.sortField || "",
      sortOrder: state.sortOrder,
      page: state.page.toString(),
    });
  }, [state, setSearchParams]);

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
  if (error)
    return (
      <div className={styles.error}>
        <p>❌ Ошибка: {error}</p>
        <Button onClick={() => window.location.reload()} >
          Повторить
        </Button>
      </div>
    );
  

  const currentData = filteredData.slice(
    (state.page - 1) * itemsPerPage,
    state.page * itemsPerPage
  );

  const handleNextPage = () => {
    if (state.page < Math.ceil(filteredData.length / itemsPerPage)) {
      setState((prevState) => ({ ...prevState, page: prevState.page + 1 }));
    }
  };

  const handlePrevPage = () => {
    if (state.page > 1) {
      setState((prevState) => ({ ...prevState, page: prevState.page - 1 }));
    }
  };

  const handleSort = (field: "id" | "title") => {
    setState((prevState) => ({
      ...prevState,
      sortField: field,
      sortOrder:
        prevState.sortField === field && prevState.sortOrder === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleInputChange = (field: keyof TableState, value: string) => {
    setState((prevState) => ({ ...prevState, [field]: value, page: 1 }));
  };

  return (
    <div className={styles.container}>
      <h1></h1>
      <div className={styles.filters}>
        <div className={styles.idFilter}>
          <label>Фильтр по ID (пример: 1-10):</label>
          <input
            type="text"
            value={state.idFilter}
            onChange={(e) =>
              handleInputChange(
                "idFilter",
                e.target.value.replace(/[^0-9-]/g, "")
              )
            }
            placeholder="Введите диапазон ID"
            className={styles.searchInput}
          />
        </div>
        <div className={styles.titleFilter}>
          <label>Фильтр по заголовку или описанию:</label>
          <input
            type="text"
            placeholder="Введите заголовок или описание:"
            value={state.searchQuery}
            onChange={(e) => handleInputChange("searchQuery", e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th onClick={() => handleSort("id")}>
              ID{" "}
              {state.sortField === "id" &&
                (state.sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => handleSort("title")}>
              Title{" "}
              {state.sortField === "title" &&
                (state.sortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th>Body</th>
          </tr>
        </thead>
        <TransitionGroup component="tbody">
          {currentData.map((item) => {
            const nodeRef = createRef<HTMLTableRowElement>();
            return (
              <CSSTransition
                key={item.id}
                timeout={300}
                classNames="fade"
                nodeRef={nodeRef}
              >
                <tr ref={nodeRef}>
                  <td>{item.id}</td>
                  <td>{item.title}</td>
                  <td>{item.body}</td>
                </tr>
              </CSSTransition>
            );
          })}
        </TransitionGroup>
      </table>

      <div className={styles.pagination}>
        <Button onClick={handlePrevPage} disabled={state.page === 1}>
          Назад
        </Button>
        <span>
          Страница {state.page} из{" "}
          {Math.ceil(filteredData.length / itemsPerPage)}
        </span>
        <Button
          onClick={handleNextPage}
          disabled={
            state.page === Math.ceil(filteredData.length / itemsPerPage)
          }
        >
          Вперед
        </Button>
      </div>
    </div>
  );
};

export default Table;
