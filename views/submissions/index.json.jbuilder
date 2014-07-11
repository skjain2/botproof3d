json.array!(@submissions) do |submission|
  json.extract! submission, :user_id, :name, :rating, :orientation, :description
  json.url submission_url(submission, format: :json)
end
