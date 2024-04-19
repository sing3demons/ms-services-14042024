package todo

type ResponseData[T any] struct {
	Items    T     `json:"items"`
	Total    int64 `json:"total"`
	Page     int   `json:"page"`
	PageSize int   `json:"pageSize"`
}

type TaskQuery struct {
	Status   string `json:"status"`
	Page     int    `json:"page"`
	PageSize int    `json:"pageSize"`
	Sort     string `json:"sort"`
	Order    int    `json:"order"`
}

type Task struct {
	ID          string `json:"id" bson:"id"`
	Href        string `json:"href"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Done        bool   `json:"done"`
	StartDate   string `json:"startDate"`
	EndDate     string `json:"endDate"`
	Status      string `json:"status"`
}
